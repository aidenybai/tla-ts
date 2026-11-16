// The part of the JavaScript module that reads a Temporal object's internal slots, which comes
// before Get, as Get runs the getters of Temporal's prototypes. tla-ts holds what each getter gives
// with the object's slots.
export const TEMPORAL_GETTERS = String.raw`
\* A Temporal object's internal slots, or a record whose kind is "" for another value.
LOCAL TSlots(heap, value) ==
  IF IsHeap(value) /\ "temporal" \in DOMAIN heap.objects[value[Ref]]
  THEN heap.objects[value[Ref]].temporal
  ELSE [kind |-> ""]

LOCAL TemporalGetterOwner(path) ==
  CHOOSE kind \in {"Duration", "Instant", "PlainDate", "PlainTime", "PlainDateTime", "PlainYearMonth",
                   "PlainMonthDay", "ZonedDateTime"} :
    HasPrefix(path, "get Temporal." \o kind \o ".prototype.")

LOCAL TemporalGetterName(path) ==
  SubSeq(path, Len("get Temporal." \o TemporalGetterOwner(path) \o ".prototype.") + 1, Len(path))

\* Whether a Temporal prototype's getter reads a receiver, which throws a TypeError otherwise.
TemporalGets(heap, path, receiver) == TSlots(heap, receiver).kind = TemporalGetterOwner(path)

TemporalGetterValue(heap, path, receiver) == TSlots(heap, receiver).getters[TemporalGetterName(path)]
`;

// The part of the JavaScript module that runs Temporal, over the ISO 8601 calendar, as the Temporal
// proposal's spec defines it. tla-ts holds a Temporal object's internal slots in its record's
// temporal field, and computes with exact integers as BigInts. A function that would run code that
// a script gives, such as a getter of a property bag or an object's valueOf, stops.
export const TEMPORAL_DEFINITIONS = String.raw`
\* The outcome of a step of a Temporal function: the error that it throws, or "", and its value.
LOCAL TOk(value) == [error |-> "", value |-> value]

LOCAL TFail(kind) == [error |-> kind, value |-> Undefined]

LOCAL TArgument(arguments, position) ==
  IF position <= Len(arguments) THEN arguments[position] ELSE Undefined

LOCAL TBig(integer) == BigIntOfInteger(integer)

LOCAL TIsNegative(value) == BigIntIsNegative(value)

LOCAL TIsZero(value) == BigIntIsZero(value)

LOCAL TSign(value) == CASE TIsZero(value) -> 0 [] TIsNegative(value) -> -1 [] OTHER -> 1

LOCAL TLess(left, right) == TIsNegative(BigIntSubtract(left, right))

LOCAL TCompare(left, right) == TSign(BigIntSubtract(left, right))

LOCAL TAbs(value) == IF TIsNegative(value) THEN BigIntNegate(value) ELSE value

LOCAL TPower10(count) == BigIntOf(FALSE, NatPower(<<10>>, count))

\* floor(left / right) and left modulo right, for a divisor above 0.
LOCAL TFloorDivide(left, right) ==
  LET quotient == BigIntDivide(left, right)
  IN IF TIsNegative(left) /\ ~TIsZero(BigIntRemainder(left, right))
     THEN BigIntSubtract(quotient, Big :> 1)
     ELSE quotient

LOCAL TModulo(left, right) == BigIntSubtract(left, BigIntMultiply(TFloorDivide(left, right), right))

\* The TLC integer of a BigInt that it holds.
LOCAL TSmall(value) == IntegerOfBigInt(value)

\* R(F(x)): an integer rounded to the nearest Number.
LOCAL TFloat64(value) == ToBigInt(NumberOfBigInt(value))

LOCAL TNsPerSecond == Big :> 1000000000

LOCAL TNsPerMinute == BigIntMultiply(Big :> 60, TNsPerSecond)

LOCAL TNsPerHour == BigIntMultiply(Big :> 3600, TNsPerSecond)

LOCAL TNsPerDay == BigIntMultiply(Big :> 86400, TNsPerSecond)

\* 2^53 * 10^9 - 1, the most that a time duration holds either way.
LOCAL TMaxTimeDuration ==
  BigIntSubtract(BigIntMultiply(BigIntOf(FALSE, NatShiftLeft(<<1>>, 53)), TNsPerSecond), Big :> 1)

\* A quotient of two integers, the divisor above 0, rounded to the nearest Number.
LOCAL TQuotientNumber(dividend, divisor) ==
  IF TIsZero(dividend)
  THEN 0
  ELSE LET a == BigIntNat(dividend)
           b == BigIntNat(divisor)
           spare == 55 + NatBits(b) - NatBits(a)
           shift == IF spare > 0 THEN spare ELSE 0
           division == NatDivide(NatShiftLeft(a, shift), b)
       IN Rounded(TIsNegative(dividend),
                  NatAdd(NatShiftLeft(division[1], 1), IF division[2] = <<>> THEN <<>> ELSE <<1>>),
                  -shift - 1)

\* The decimal digits of a natural below 10^count, with zeros before them to make count.
LOCAL TPadded(text, count) ==
  IF Len(text) >= count THEN text ELSE SubSeq("000000000000", 1, count - Len(text)) \o text

LOCAL TDecimal(value) == BigIntText(value)

LOCAL TIsObject(heap, value) == IsObjectIn(heap, value)

\* A getter of a Temporal prototype, which reads only its receiver's internal slots.
LOCAL TIsTemporalGetter(getter) ==
  IsRef(getter) /\ TypeOf(getter[Ref]) = "string" /\ HasPrefix(getter[Ref], "get Temporal.")

\* Get, where it would run no code that a script gives.
LOCAL TGet(heap, object, key) ==
  LET getter == GetterOf(heap, object, key)
  IN CASE ~IsRef(object) -> Get(heap, object, key)
       [] ReachesProxy(heap, object) ->
            Assert(FALSE, "tla-ts can't run a proxy's trap that a Temporal function reaches")
       [] getter # Undefined /\ ~TIsTemporalGetter(getter) ->
            Assert(FALSE, "tla-ts can't run a getter that a Temporal function reads")
       [] OTHER -> Get(heap, object, key)

\* ToNumber of a value that a Temporal function reads.
LOCAL TToNumber(value) ==
  CASE IsBigInt(value) \/ IsSymbol(value) -> TFail("TypeError")
    [] IsRef(value) \/ IsSequenceValue(value) ->
         Assert(FALSE, "tla-ts can't convert an object that a Temporal function reads to a number")
    [] OTHER -> TOk(ToNumber(value))

\* ToString of a value that a Temporal function reads.
LOCAL TToString(value) ==
  CASE IsSymbol(value) -> TFail("TypeError")
    [] IsRef(value) \/ IsSequenceValue(value) ->
         Assert(FALSE, "tla-ts can't convert an object that a Temporal function reads to a string")
    [] OTHER -> TOk(StringOf(value))

\* ToIntegerIfIntegral.
LOCAL TIntegral(value) ==
  LET number == TToNumber(value)
  IN CASE number.error # "" -> number
       [] ~IsIntegral(number.value) -> TFail("RangeError")
       [] OTHER -> TOk(ToBigInt(number.value))

\* ToIntegerWithTruncation.
LOCAL TTruncated(value) ==
  LET number == TToNumber(value)
  IN CASE number.error # "" -> number
       [] ~IsFinite(number.value) -> TFail("RangeError")
       [] IsIntegral(number.value) -> TOk(ToBigInt(number.value))
       [] IsFraction(number.value) -> TOk(TBig(Truncate(number.value)))
       [] OTHER -> TOk(BigIntOf(Binary(number.value)[1],
                                NatShiftRight(Significand(Binary(number.value)), -Binary(number.value)[2])))

\* The first error of steps in order, or "".
LOCAL TFirstError(steps) ==
  LET failed == SelectSeq(steps, LAMBDA step : step.error # "")
  IN IF failed = <<>> THEN "" ELSE Head(failed).error

\* GetOptionsObject, where undefined stands for an object without properties.
LOCAL TOptions(heap, options) ==
  CASE options = Undefined -> TOk(Undefined)
    [] TIsObject(heap, options) -> TOk(options)
    [] OTHER -> TFail("TypeError")

LOCAL TOption(heap, options, key) == IF options = Undefined THEN Undefined ELSE TGet(heap, options, key)

\* GetOption of a string among allowed, of the option's value, or the fallback where it's undefined.
LOCAL TStringOf(value, allowed, fallback) ==
  LET text == TToString(value)
  IN CASE value = Undefined -> TOk(fallback)
       [] text.error # "" -> text
       [] text.value \notin allowed -> TFail("RangeError")
       [] OTHER -> text

LOCAL TRoundingModes ==
  {"ceil", "floor", "expand", "trunc", "halfCeil", "halfFloor", "halfExpand", "halfTrunc", "halfEven"}

LOCAL TRoundingModeOption(heap, options, fallback) ==
  TStringOf(TOption(heap, options, "roundingMode"), TRoundingModes, fallback)

\* GetRoundingIncrementOption.
LOCAL TRoundingIncrementOption(heap, options) ==
  LET value == TOption(heap, options, "roundingIncrement")
      integer == TTruncated(value)
  IN CASE value = Undefined -> TOk(Big :> 1)
       [] integer.error # "" -> integer
       [] TLess(integer.value, Big :> 1) \/ TLess(Big :> 1000000000, integer.value) -> TFail("RangeError")
       [] OTHER -> integer

\* The units by descending magnitude.
LOCAL TUnits ==
  <<"year", "month", "week", "day", "hour", "minute", "second", "millisecond", "microsecond",
    "nanosecond">>

LOCAL TPluralUnits ==
  <<"years", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds",
    "microseconds", "nanoseconds">>

LOCAL TUnitIndex(unit) == CHOOSE position \in 1..10 : TUnits[position] = unit

LOCAL TLargerUnit(left, right) == IF TUnitIndex(left) <= TUnitIndex(right) THEN left ELSE right

LOCAL TIsCalendarUnit(unit) == unit \in {"year", "month", "week"}

LOCAL TIsDateUnit(unit) == unit \in {"year", "month", "week", "day"}

\* The length of a time unit or a day in nanoseconds.
LOCAL TUnitLength(unit) ==
  CASE unit = "day" -> TNsPerDay
    [] unit = "hour" -> TNsPerHour
    [] unit = "minute" -> TNsPerMinute
    [] unit = "second" -> TNsPerSecond
    [] unit = "millisecond" -> Big :> 1000000
    [] unit = "microsecond" -> Big :> 1000
    [] OTHER -> Big :> 1

\* MaximumTemporalDurationRoundingIncrement, or 0 for unset.
LOCAL TMaximumIncrement(unit) ==
  CASE unit = "hour" -> 24
    [] unit \in {"minute", "second"} -> 60
    [] unit \in {"millisecond", "microsecond", "nanosecond"} -> 1000
    [] OTHER -> 0

\* GetTemporalUnitValuedOption of the option's value, as a unit, "auto", or "unset".
LOCAL TUnitOf(value) ==
  LET allowed == {TUnits[position] : position \in 1..10} \cup {TPluralUnits[position] : position \in 1..10}
                   \cup {"auto"}
      text == TStringOf(value, allowed, "unset")
  IN CASE text.error # "" -> text
       [] text.value \in {TPluralUnits[position] : position \in 1..10} ->
            TOk(TUnits[CHOOSE position \in 1..10 : TPluralUnits[position] = text.value])
       [] OTHER -> text

LOCAL TUnitOption(heap, options, key) == TUnitOf(TOption(heap, options, key))

\* ValidateTemporalUnitValue, of a group: "date", "time", or "datetime".
LOCAL TUnitValid(unit, group, extra) ==
  \/ unit = "unset"
  \/ unit \in extra
  \/ unit # "auto" /\ TIsDateUnit(unit) /\ group \in {"date", "datetime"}
  \/ unit # "auto" /\ ~TIsDateUnit(unit) /\ group \in {"time", "datetime"}

\* ValidateTemporalRoundingIncrement.
LOCAL TIncrementValid(increment, dividend, isInclusive) ==
  LET maximum == IF isInclusive THEN dividend ELSE dividend - 1
  IN ~TLess(TBig(maximum), increment) /\ TIsZero(BigIntRemainder(TBig(dividend), increment))

\* GetUnsignedRoundingMode.
LOCAL TUnsignedMode(mode, isNegative) ==
  CASE mode = "ceil" -> IF isNegative THEN "zero" ELSE "infinity"
    [] mode = "floor" -> IF isNegative THEN "infinity" ELSE "zero"
    [] mode = "expand" -> "infinity"
    [] mode = "trunc" -> "zero"
    [] mode = "halfCeil" -> IF isNegative THEN "half-zero" ELSE "half-infinity"
    [] mode = "halfFloor" -> IF isNegative THEN "half-infinity" ELSE "half-zero"
    [] mode = "halfExpand" -> "half-infinity"
    [] mode = "halfTrunc" -> "half-zero"
    [] OTHER -> "half-even"

\* Whether ApplyUnsignedRoundingMode picks the greater of r1 and r1 + 1 for a magnitude whose
\* quotient is r1 and whose remainder by the divisor isn't 0.
LOCAL TRoundsUp(unsigned, quotient, remainder, divisor) ==
  LET half == TCompare(BigIntMultiply(remainder, Big :> 2), divisor)
  IN CASE TIsZero(remainder) -> FALSE
       [] unsigned = "zero" -> FALSE
       [] unsigned = "infinity" -> TRUE
       [] half < 0 -> FALSE
       [] half > 0 -> TRUE
       [] unsigned = "half-zero" -> FALSE
       [] unsigned = "half-infinity" -> TRUE
       [] OTHER -> ~TIsZero(BigIntRemainder(quotient, Big :> 2))

\* RoundNumberToIncrement of an integer.
LOCAL TRoundToIncrement(value, increment, mode) ==
  LET isNegative == TIsNegative(value)
      magnitude == TAbs(value)
      quotient == BigIntDivide(magnitude, increment)
      remainder == BigIntRemainder(magnitude, increment)
      rounded == IF TRoundsUp(TUnsignedMode(mode, isNegative), quotient, remainder, increment)
                 THEN BigIntAdd(quotient, Big :> 1)
                 ELSE quotient
  IN BigIntMultiply(IF isNegative THEN BigIntNegate(rounded) ELSE rounded, increment)

\* RoundNumberToIncrementAsIfPositive of an integer.
LOCAL TRoundToIncrementAsIfPositive(value, increment, mode) ==
  LET quotient == TFloorDivide(value, increment)
      remainder == TModulo(value, increment)
      rounded == IF TRoundsUp(TUnsignedMode(mode, FALSE), quotient, remainder, increment)
                 THEN BigIntAdd(quotient, Big :> 1)
                 ELSE quotient
  IN BigIntMultiply(rounded, increment)

\* The rounding mode that since uses for until's.
LOCAL TNegatedMode(mode) ==
  CASE mode = "ceil" -> "floor"
    [] mode = "floor" -> "ceil"
    [] mode = "halfCeil" -> "halfFloor"
    [] mode = "halfFloor" -> "halfCeil"
    [] OTHER -> mode

\* GetTemporalFractionalSecondDigitsOption, as a count, or -1 for auto.
LOCAL TDigitsOption(heap, options) ==
  LET value == TOption(heap, options, "fractionalSecondDigits")
      text == TToString(value)
  IN CASE value = Undefined -> TOk(-1)
       [] TypeOf(value) # "number" ->
            IF text.error # "" THEN text ELSE IF text.value = "auto" THEN TOk(-1) ELSE TFail("RangeError")
       [] ~IsFinite(value) \/ LessThan(value, 0) \/ ~LessThan(value, 10) -> TFail("RangeError")
       [] OTHER -> TOk(CHOOSE count \in 0..9 : LessOrEqual(count, value) /\ LessThan(value, count + 1))

\* ToSecondsStringPrecisionRecord, whose precision is a count, -1 for auto, or -2 for minute.
LOCAL TPrecision(unit, digits) ==
  CASE unit = "minute" -> [precision |-> -2, unit |-> "minute", increment |-> 1]
    [] unit = "second" -> [precision |-> 0, unit |-> "second", increment |-> 1]
    [] unit = "millisecond" -> [precision |-> 3, unit |-> "millisecond", increment |-> 1]
    [] unit = "microsecond" -> [precision |-> 6, unit |-> "microsecond", increment |-> 1]
    [] unit = "nanosecond" -> [precision |-> 9, unit |-> "nanosecond", increment |-> 1]
    [] digits = -1 -> [precision |-> -1, unit |-> "nanosecond", increment |-> 1]
    [] digits = 0 -> [precision |-> 0, unit |-> "second", increment |-> 1]
    [] digits <= 3 -> [precision |-> digits, unit |-> "millisecond", increment |-> 10 ^ (3 - digits)]
    [] digits <= 6 -> [precision |-> digits, unit |-> "microsecond", increment |-> 10 ^ (6 - digits)]
    [] OTHER -> [precision |-> digits, unit |-> "nanosecond", increment |-> 10 ^ (9 - digits)]

\* FormatFractionalSeconds of a TLC integer of nanoseconds, with -1 for auto.
LOCAL TFractionalSeconds(nanoseconds, precision) ==
  LET text == TPadded(ToString(nanoseconds), 9)
      RECURSIVE Trimmed(_)
      Trimmed(digits) ==
        IF SubSeq(digits, Len(digits), Len(digits)) = "0"
        THEN Trimmed(SubSeq(digits, 1, Len(digits) - 1))
        ELSE digits
  IN CASE precision = -1 -> IF nanoseconds = 0 THEN "" ELSE "." \o Trimmed(text)
       [] precision = 0 -> ""
       [] OTHER -> "." \o SubSeq(text, 1, precision)

\* The decimal digits of a string, from 0 to 9 each.
LOCAL TDigitText == "0123456789"

LOCAL TIsDigit(character) == character # "" /\ \E digit \in 1..10 : SubSeq(TDigitText, digit, digit) = character

LOCAL TDigitValue(character) == CHOOSE digit \in 0..9 : SubSeq(TDigitText, digit + 1, digit + 1) = character

LOCAL TCharacter(text, position) ==
  IF position >= 1 /\ position <= Len(text) THEN SubSeq(text, position, position) ELSE ""

\* The natural that a run of decimal digits writes.
RECURSIVE TemporalDigitsNat(_, _)
TemporalDigitsNat(text, position) ==
  IF position = 0
  THEN <<>>
  ELSE NatAdd(NatTimes(TemporalDigitsNat(text, position - 1), 10), NatOf(TDigitValue(TCharacter(text, position))))

LOCAL TDigitsValue(text) == BigIntOf(FALSE, TemporalDigitsNat(text, Len(text)))

\* The length of the run of decimal digits in a text from a position.
RECURSIVE TemporalDigitRun(_, _)
TemporalDigitRun(text, position) ==
  IF TIsDigit(TCharacter(text, position)) THEN 1 + TemporalDigitRun(text, position + 1) ELSE 0

\* ---------------------------------------------------------------------------------------------
\* Durations, whose fields tla-ts holds as a sequence of ten integers from years to nanoseconds.

LOCAL TDurationKeys ==
  <<"years", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds",
    "microseconds", "nanoseconds">>

LOCAL TZeroDuration == [position \in 1..10 |-> Big :> 0]

LOCAL TDurationSign(fields) ==
  LET nonzero == SelectSeq(fields, LAMBDA field : ~TIsZero(field))
  IN IF nonzero = <<>> THEN 0 ELSE TSign(Head(nonzero))

\* TimeDurationFromComponents of a duration's fields, without its days.
LOCAL TTimeOf(fields) ==
  BigIntAdd(BigIntAdd(BigIntAdd(BigIntMultiply(fields[5], TNsPerHour), BigIntMultiply(fields[6], TNsPerMinute)),
                      BigIntAdd(BigIntMultiply(fields[7], TNsPerSecond), BigIntMultiply(fields[8], Big :> 1000000))),
            BigIntAdd(BigIntMultiply(fields[9], Big :> 1000), fields[10]))

LOCAL TIsValidDuration(fields) ==
  LET normalized ==
        BigIntAdd(BigIntAdd(BigIntAdd(BigIntMultiply(fields[4], TNsPerDay), BigIntMultiply(fields[5], TNsPerHour)),
                            BigIntAdd(BigIntMultiply(fields[6], TNsPerMinute), BigIntMultiply(fields[7], TNsPerSecond))),
                  BigIntAdd(BigIntAdd(BigIntMultiply(TFloat64(fields[8]), Big :> 1000000),
                                      BigIntMultiply(TFloat64(fields[9]), Big :> 1000)),
                            TFloat64(fields[10])))
      two32 == BigIntOf(FALSE, NatShiftLeft(<<1>>, 32))
  IN /\ ~(\E left, right \in 1..10 : TIsNegative(fields[left]) /\ TSign(fields[right]) = 1)
     /\ \A position \in 1..3 : TLess(TAbs(fields[position]), two32)
     /\ ~TLess(TMaxTimeDuration, TAbs(normalized))

\* The fields of CreateTemporalDuration, or its RangeError.
LOCAL TCheckedDuration(fields) ==
  IF TIsValidDuration(fields) THEN TOk([position \in 1..10 |-> TFloat64(fields[position])]) ELSE TFail("RangeError")

LOCAL TNegatedDuration(fields) == [position \in 1..10 |-> BigIntNegate(fields[position])]

LOCAL TDefaultLargestUnit(fields) ==
  LET nonzero == {position \in 1..10 : ~TIsZero(fields[position])}
  IN IF nonzero = {} THEN "nanosecond" ELSE TUnits[CHOOSE position \in nonzero : \A other \in nonzero : position <= other]

\* ToTemporalPartialDurationRecord, as each field's integer or undefined.
LOCAL TPartialDuration(heap, item) ==
  LET order == <<4, 5, 9, 8, 6, 2, 10, 7, 3, 1>>
      read == [position \in 1..10 |-> TGet(heap, item, TDurationKeys[position])]
      converted == [position \in 1..10 |-> IF read[position] = Undefined THEN TOk(Undefined) ELSE TIntegral(read[position])]
      error == TFirstError([position \in 1..10 |-> converted[order[position]]])
  IN CASE ~TIsObject(heap, item) -> TFail("TypeError")
       [] error # "" -> TFail(error)
       [] \A position \in 1..10 : read[position] = Undefined -> TFail("TypeError")
       [] OTHER -> TOk([position \in 1..10 |-> converted[position].value])

\* ParseTemporalDurationString, as a duration's fields before CreateTemporalDuration, or its RangeError.
LOCAL TParseDurationText(text) ==
  LET signed == TCharacter(text, 1) \in {"+", "-"}
      start == IF signed THEN 2 ELSE 1
      isNegative == TCharacter(text, 1) = "-"
      \* The components after P: each a run of digits, an optional fraction, and a designator.
      RECURSIVE Components(_, _)
      Components(position, isTime) ==
        LET digits == TemporalDigitRun(text, position)
            separator == TCharacter(text, position + digits)
            fraction == IF separator \in {".", ","} THEN TemporalDigitRun(text, position + digits + 1) ELSE 0
            fractionEnd == IF separator \in {".", ","} THEN position + digits + 1 + fraction ELSE position + digits
            designator == TCharacter(text, fractionEnd)
            next == fractionEnd + 1
        IN CASE position > Len(text) -> <<>>
             [] TCharacter(text, position) \in {"T", "t"} /\ ~isTime ->
                  <<[designator |-> "T", digits |-> "", fraction |-> "", hasFraction |-> FALSE]>>
                    \o Components(position + 1, TRUE)
             [] digits = 0 -> <<[designator |-> "?", digits |-> "", fraction |-> "", hasFraction |-> FALSE]>>
             [] separator \in {".", ","} /\ (fraction = 0 \/ fraction > 9) ->
                  <<[designator |-> "?", digits |-> "", fraction |-> "", hasFraction |-> FALSE]>>
             [] OTHER ->
                  <<[designator |-> (IF isTime THEN "T" ELSE "") \o designator,
                     digits |-> SubSeq(text, position, position + digits - 1),
                     fraction |-> IF separator \in {".", ","}
                                  THEN SubSeq(text, position + digits + 1, fractionEnd - 1)
                                  ELSE "",
                     hasFraction |-> separator \in {".", ","}]>>
                    \o Components(next, isTime)
      parts == IF TCharacter(text, start) \in {"P", "p"} THEN Components(start + 1, FALSE) ELSE <<>>
      order == <<"Y", "M", "W", "D", "T", "TH", "TM", "TS">>
      upper(designator) ==
        CASE designator \in {"y", "Y"} -> "Y" [] designator \in {"m", "M"} -> "M"
          [] designator \in {"w", "W"} -> "W" [] designator \in {"d", "D"} -> "D"
          [] designator = "T" -> "T"
          [] designator \in {"Th", "TH"} -> "TH" [] designator \in {"Tm", "TM"} -> "TM"
          [] designator \in {"Ts", "TS"} -> "TS"
          [] OTHER -> "?"
      kinds == [position \in DOMAIN parts |-> upper(parts[position].designator)]
      rank(kind) == CHOOSE position \in 1..8 : order[position] = kind
      timeAt == {position \in DOMAIN kinds : kinds[position] = "T"}
      isValid ==
        /\ TCharacter(text, start) \in {"P", "p"}
        /\ parts # <<>>
        /\ \A position \in DOMAIN kinds : kinds[position] # "?"
        /\ \A position \in 1..(Len(kinds) - 1) : rank(kinds[position]) < rank(kinds[position + 1])
        \* A T needs a time part after it, and the date part needs something before T.
        /\ kinds[Len(kinds)] # "T"
        /\ kinds[1] # "T" \/ Len(kinds) > 1
        \* Only the last of hours, minutes, and seconds may have a fraction, and no date part may.
        /\ \A position \in DOMAIN parts :
             parts[position].hasFraction => kinds[position] \in {"TH", "TM", "TS"} /\ position = Len(parts)
      \* ToIntegerWithTruncation converts each run of digits to a Number, which may be infinite.
      isFinite ==
        \A position \in DOMAIN parts :
          parts[position].digits = "" \/ NumberOfBigInt(TDigitsValue(parts[position].digits)) # Infinity
      valueOf(kind) ==
        LET found == {position \in DOMAIN kinds : kinds[position] = kind}
        IN IF found = {} THEN Big :> 0 ELSE TFloat64(TDigitsValue(parts[CHOOSE position \in found : TRUE].digits))
      fractionOf(kind) ==
        LET found == {position \in DOMAIN kinds : kinds[position] = kind /\ parts[position].hasFraction}
        IN IF found = {} THEN "" ELSE parts[CHOOSE position \in found : TRUE].fraction
      \* The nanoseconds that a fraction of a unit gives.
      fractionNs(kind, length) ==
        LET digits == fractionOf(kind)
        IN IF digits = "" THEN Big :> 0
           ELSE BigIntDivide(BigIntMultiply(TDigitsValue(digits), length), TPower10(Len(digits)))
      extra == BigIntAdd(BigIntAdd(fractionNs("TH", TNsPerHour), fractionNs("TM", TNsPerMinute)),
                         fractionNs("TS", TNsPerSecond))
      hasHourFraction == fractionOf("TH") # ""
      hasMinuteFraction == fractionOf("TM") # ""
      minutes == IF hasHourFraction THEN BigIntDivide(extra, TNsPerMinute) ELSE valueOf("TM")
      seconds == IF hasHourFraction \/ hasMinuteFraction
                 THEN BigIntDivide(BigIntRemainder(extra, TNsPerMinute), TNsPerSecond)
                 ELSE valueOf("TS")
      subsecond == BigIntRemainder(extra, TNsPerSecond)
      fields == <<valueOf("Y"), valueOf("M"), valueOf("W"), valueOf("D"), valueOf("TH"), minutes, seconds,
                  BigIntDivide(subsecond, Big :> 1000000),
                  BigIntDivide(BigIntRemainder(subsecond, Big :> 1000000), Big :> 1000),
                  BigIntRemainder(subsecond, Big :> 1000)>>
  IN IF isValid /\ isFinite
     THEN TOk(IF isNegative THEN TNegatedDuration(fields) ELSE fields)
     ELSE TFail("RangeError")

\* ToTemporalDuration, as the fields of the duration that it makes.
LOCAL TToDuration(heap, item) ==
  LET slots == TSlots(heap, item)
      partial == TPartialDuration(heap, item)
      parsed == TParseDurationText(item)
  IN CASE slots.kind = "Duration" -> TOk(slots.fields)
       [] ~TIsObject(heap, item) /\ TypeOf(item) # "string" -> TFail("TypeError")
       [] ~TIsObject(heap, item) -> IF parsed.error # "" THEN parsed ELSE TCheckedDuration(parsed.value)
       [] partial.error # "" -> partial
       [] OTHER ->
            TCheckedDuration([position \in 1..10 |->
                                IF partial.value[position] = Undefined THEN Big :> 0 ELSE partial.value[position]])

\* TemporalDurationFromInternal of a duration's date fields and a time duration, as the fields of
\* CreateTemporalDuration, or its RangeError.
LOCAL TDurationFromInternal(date, time, largestUnit) ==
  LET sign == TSign(time)
      magnitude == TAbs(time)
      index == TUnitIndex(largestUnit)
      \* The units from largestUnit down, whose lengths divide the time duration in turn.
      lengths == <<TNsPerDay, TNsPerHour, TNsPerMinute, TNsPerSecond, Big :> 1000000, Big :> 1000, Big :> 1>>
      first == IF index <= 4 THEN 1 ELSE index - 3
      RECURSIVE Split(_, _)
      Split(rest, position) ==
        IF position > 7
        THEN <<>>
        ELSE IF position < first
             THEN <<Big :> 0>> \o Split(rest, position + 1)
             ELSE <<BigIntDivide(rest, lengths[position])>>
                    \o Split(BigIntRemainder(rest, lengths[position]), position + 1)
      parts == Split(magnitude, 1)
      signed(value) == IF sign < 0 THEN BigIntNegate(value) ELSE value
  IN TCheckedDuration(<<date[1], date[2], date[3], BigIntAdd(date[4], signed(parts[1])),
                        signed(parts[2]), signed(parts[3]), signed(parts[4]), signed(parts[5]),
                        signed(parts[6]), signed(parts[7])>>)

\* TemporalDurationToString.
LOCAL TDurationText(fields, precision) ==
  LET sign == TDurationSign(fields)
      part(position, designator) ==
        IF TIsZero(fields[position]) THEN "" ELSE TDecimal(TAbs(fields[position])) \o designator
      datePart == part(1, "Y") \o part(2, "M") \o part(3, "W") \o part(4, "D")
      seconds == BigIntAdd(BigIntAdd(BigIntMultiply(fields[7], TNsPerSecond), BigIntMultiply(fields[8], Big :> 1000000)),
                           BigIntAdd(BigIntMultiply(fields[9], Big :> 1000), fields[10]))
      isSecondsShown ==
        \/ ~TIsZero(seconds)
        \/ TDefaultLargestUnit(fields) \in {"second", "millisecond", "microsecond", "nanosecond"}
        \/ precision # -1
      secondsPart ==
        IF isSecondsShown
        THEN TDecimal(TAbs(BigIntDivide(seconds, TNsPerSecond)))
               \o TFractionalSeconds(TSmall(TAbs(BigIntRemainder(seconds, TNsPerSecond))), precision) \o "S"
        ELSE ""
      timePart == part(5, "H") \o part(6, "M") \o secondsPart
  IN (IF sign < 0 THEN "-" ELSE "") \o "P" \o datePart \o (IF timePart = "" THEN "" ELSE "T" \o timePart)

\* Temporal.Duration.prototype.toString.
LOCAL TDurationToString(heap, fields, value) ==
  LET options == TOptions(heap, value)
      digits == TDigitsOption(heap, options.value)
      mode == TRoundingModeOption(heap, options.value, "trunc")
      smallest == TUnitOption(heap, options.value, "smallestUnit")
      precision == TPrecision(smallest.value, digits.value)
      time == TTimeOf(fields)
      rounded == TRoundToIncrement(time, BigIntMultiply(TBig(precision.increment), TUnitLength(precision.unit)),
                                   mode.value)
      balanced == TDurationFromInternal(<<fields[1], fields[2], fields[3], fields[4]>>, rounded,
                                        TLargerUnit(TDefaultLargestUnit(fields), "second"))
  IN CASE options.error # "" -> options
       [] digits.error # "" -> digits
       [] mode.error # "" -> mode
       [] smallest.error # "" -> smallest
       [] ~TUnitValid(smallest.value, "time", {}) -> TFail("RangeError")
       [] smallest.value \in {"hour", "minute"} -> TFail("RangeError")
       [] precision.unit = "nanosecond" /\ precision.increment = 1 -> TOk(TDurationText(fields, precision.precision))
       [] TLess(TMaxTimeDuration, TAbs(rounded)) -> TFail("RangeError")
       [] balanced.error # "" -> balanced
       [] OTHER -> TOk(TDurationText(balanced.value, precision.precision))

\* AddDurations.
LOCAL TDurationAdd(heap, fields, other, isSubtract) ==
  LET converted == TToDuration(heap, other)
      added == IF isSubtract THEN TNegatedDuration(converted.value) ELSE converted.value
      largestUnit == TLargerUnit(TDefaultLargestUnit(fields), TDefaultLargestUnit(added))
      total(duration) == BigIntAdd(TTimeOf(duration), BigIntMultiply(duration[4], TNsPerDay))
      sum == BigIntAdd(total(fields), total(added))
  IN CASE converted.error # "" -> converted
       [] TIsCalendarUnit(largestUnit) -> TFail("RangeError")
       [] TLess(TMaxTimeDuration, TAbs(sum)) -> TFail("RangeError")
       [] OTHER -> TDurationFromInternal(<<Big :> 0, Big :> 0, Big :> 0, Big :> 0>>, sum, largestUnit)

\* GetTemporalRelativeToOption, which tla-ts runs only where relativeTo is undefined.
LOCAL TRelativeToUnset(heap, options) ==
  TOption(heap, options, "relativeTo") = Undefined

LOCAL TRelativeToStop == Assert(FALSE, "tla-ts can't round or compare a duration relative to a date")

\* Temporal.Duration.prototype.round, without relativeTo.
LOCAL TDurationRound(heap, fields, roundTo) ==
  LET options == IF TypeOf(roundTo) = "string" THEN TOk(Undefined) ELSE TOptions(heap, roundTo)
      unitOf(key) ==
        IF TypeOf(roundTo) = "string"
        THEN IF key = "smallestUnit" THEN TUnitOf(roundTo) ELSE TOk("unset")
        ELSE TUnitOption(heap, options.value, key)
      largest == unitOf("largestUnit")
      increment == IF TypeOf(roundTo) = "string" THEN TOk(Big :> 1) ELSE TRoundingIncrementOption(heap, options.value)
      mode == IF TypeOf(roundTo) = "string" THEN TOk("halfExpand") ELSE TRoundingModeOption(heap, options.value, "halfExpand")
      smallest == unitOf("smallestUnit")
      smallestUnit == IF smallest.value = "unset" THEN "nanosecond" ELSE smallest.value
      existing == TDefaultLargestUnit(fields)
      defaultLargest == TLargerUnit(existing, smallestUnit)
      largestUnit == IF largest.value \in {"unset", "auto"} THEN defaultLargest ELSE largest.value
      maximum == TMaximumIncrement(smallestUnit)
      time == BigIntAdd(TTimeOf(fields), BigIntMultiply(fields[4], TNsPerDay))
      rounded == TRoundToIncrement(time, BigIntMultiply(increment.value, TUnitLength(smallestUnit)), mode.value)
  IN CASE roundTo = Undefined -> TFail("TypeError")
       [] options.error # "" -> options
       [] largest.error # "" -> largest
       [] TypeOf(roundTo) # "string" /\ ~TRelativeToUnset(heap, options.value) -> TRelativeToStop
       [] increment.error # "" -> increment
       [] mode.error # "" -> mode
       [] smallest.error # "" -> smallest
       [] ~TUnitValid(smallest.value, "datetime", {}) -> TFail("RangeError")
       [] smallest.value = "unset" /\ largest.value = "unset" -> TFail("RangeError")
       [] TLargerUnit(largestUnit, smallestUnit) # largestUnit -> TFail("RangeError")
       [] maximum # 0 /\ ~TIncrementValid(increment.value, maximum, FALSE) -> TFail("RangeError")
       [] TLess(Big :> 1, increment.value) /\ largestUnit # smallestUnit /\ TIsDateUnit(smallestUnit) ->
            TFail("RangeError")
       [] TIsCalendarUnit(existing) \/ TIsCalendarUnit(largestUnit) -> TFail("RangeError")
       [] TLess(TMaxTimeDuration, TAbs(rounded)) -> TFail("RangeError")
       [] smallestUnit = "day" ->
            TDurationFromInternal(<<Big :> 0, Big :> 0, Big :> 0, BigIntDivide(rounded, TNsPerDay)>>, Big :> 0,
                                  largestUnit)
       [] OTHER -> TDurationFromInternal(<<Big :> 0, Big :> 0, Big :> 0, Big :> 0>>, rounded, largestUnit)

\* Temporal.Duration.prototype.total, without relativeTo, as the total.
LOCAL TDurationTotal(heap, fields, totalOf) ==
  LET options == IF TypeOf(totalOf) = "string" THEN TOk(Undefined) ELSE TOptions(heap, totalOf)
      unit == IF TypeOf(totalOf) = "string"
              THEN TUnitOf(totalOf)
              ELSE TUnitOption(heap, options.value, "unit")
      time == BigIntAdd(TTimeOf(fields), BigIntMultiply(fields[4], TNsPerDay))
  IN CASE totalOf = Undefined -> TFail("TypeError")
       [] options.error # "" -> options
       [] TypeOf(totalOf) # "string" /\ ~TRelativeToUnset(heap, options.value) -> TRelativeToStop
       [] unit.error # "" -> unit
       [] unit.value = "unset" -> TFail("RangeError")
       [] ~TUnitValid(unit.value, "datetime", {}) -> TFail("RangeError")
       [] TIsCalendarUnit(TDefaultLargestUnit(fields)) \/ TIsCalendarUnit(unit.value) -> TFail("RangeError")
       [] OTHER -> TOk(TQuotientNumber(time, TUnitLength(unit.value)))

\* Temporal.Duration.compare, as a number.
LOCAL TDurationCompare(heap, one, two, value) ==
  LET first == TToDuration(heap, one)
      second == TToDuration(heap, two)
      options == TOptions(heap, value)
      isCalendar == TIsCalendarUnit(TDefaultLargestUnit(first.value)) \/ TIsCalendarUnit(TDefaultLargestUnit(second.value))
      total(duration) == BigIntAdd(TTimeOf(duration), BigIntMultiply(duration[4], TNsPerDay))
  IN CASE first.error # "" -> first
       [] second.error # "" -> second
       [] options.error # "" -> options
       [] ~TRelativeToUnset(heap, options.value) -> TRelativeToStop
       [] first.value = second.value -> TOk(0)
       [] isCalendar -> TFail("RangeError")
       [] OTHER -> TOk(TCompare(total(first.value), total(second.value)))

\* ---------------------------------------------------------------------------------------------
\* The ISO 8601 calendar, where a date is <<year, month, day>> and a time <<hour, minute, second,
\* millisecond, microsecond, nanosecond>>, each of TLC integers.

LOCAL TIsLeapYear(year) == (year % 4 = 0 /\ year % 100 # 0) \/ year % 400 = 0

LOCAL TDaysInMonth(year, month) ==
  CASE month \in {1, 3, 5, 7, 8, 10, 12} -> 31
    [] month \in {4, 6, 9, 11} -> 30
    [] OTHER -> IF TIsLeapYear(year) THEN 29 ELSE 28

LOCAL TDaysInYear(year) == IF TIsLeapYear(year) THEN 366 ELSE 365

LOCAL TIsValidDate(year, month, day) ==
  month >= 1 /\ month <= 12 /\ day >= 1 /\ day <= TDaysInMonth(year, month)

\* The days from 1970-01-01 to a date, of a year that a TLC integer's days hold.
LOCAL TEpochDays(date) ==
  LET year == IF date[2] <= 2 THEN date[1] - 1 ELSE date[1]
      era == year \div 400
      yearOfEra == year - era * 400
      dayOfYear == (153 * ((date[2] + 9) % 12) + 2) \div 5 + date[3] - 1
      dayOfEra == yearOfEra * 365 + yearOfEra \div 4 - yearOfEra \div 100 + dayOfYear
  IN era * 146097 + dayOfEra - 719468

\* The date that is a count of days from 1970-01-01.
LOCAL TDateOfDays(days) ==
  LET shifted == days + 719468
      era == shifted \div 146097
      dayOfEra == shifted - era * 146097
      yearOfEra == (dayOfEra - dayOfEra \div 1460 + dayOfEra \div 36524 - dayOfEra \div 146096) \div 365
      dayOfYear == dayOfEra - (365 * yearOfEra + yearOfEra \div 4 - yearOfEra \div 100)
      shiftedMonth == (5 * dayOfYear + 2) \div 153
      month == IF shiftedMonth < 10 THEN shiftedMonth + 3 ELSE shiftedMonth - 9
  IN <<yearOfEra + era * 400 + (IF month <= 2 THEN 1 ELSE 0), month,
       dayOfYear - (153 * shiftedMonth + 2) \div 5 + 1>>

LOCAL TAddDays(date, days) == TDateOfDays(TEpochDays(date) + days)

LOCAL TDayOfWeek(date) == LET weekday == (TEpochDays(date) + 4) % 7 IN IF weekday = 0 THEN 7 ELSE weekday

LOCAL TDayOfYear(date) == TEpochDays(date) - TEpochDays(<<date[1], 1, 1>>) + 1

\* ISOWeekOfYear, as <<week, year>>.
LOCAL TWeekOfYear(date) ==
  LET dayOfYear == TDayOfYear(date)
      dayOfWeek == TDayOfWeek(date)
      week == (dayOfYear + 7 - dayOfWeek + 3) \div 7
      january == TDayOfWeek(<<date[1], 1, 1>>)
  IN CASE week < 1 ->
            IF january = 5 \/ (january = 6 /\ TIsLeapYear(date[1] - 1))
            THEN <<53, date[1] - 1>>
            ELSE <<52, date[1] - 1>>
       [] week = 53 /\ TDaysInYear(date[1]) - dayOfYear < 4 - dayOfWeek -> <<1, date[1] + 1>>
       [] OTHER -> <<week, date[1]>>

LOCAL TCompareInts(left, right) == CASE left > right -> 1 [] left < right -> -1 [] OTHER -> 0

\* CompareISODate and CompareTimeRecord.
LOCAL TCompareSequences(left, right) ==
  LET differing == {position \in DOMAIN left : left[position] # right[position]}
  IN IF differing = {}
     THEN 0
     ELSE LET first == CHOOSE position \in differing : \A other \in differing : position <= other
          IN TCompareInts(left[first], right[first])

\* ISODateWithinLimits.
LOCAL TDateWithinLimits(date) ==
  LET days == TEpochDays(date) IN days >= -100000001 /\ days <= 100000000

LOCAL TMidnight == <<0, 0, 0, 0, 0, 0>>

\* ISODateTimeWithinLimits.
LOCAL TDateTimeWithinLimits(date, time) ==
  LET days == TEpochDays(date)
  IN (days > -100000001 \/ (days = -100000001 /\ time # TMidnight)) /\ days <= 100000000

\* The years that tla-ts computes dates of, past which no date is within the limits.
LOCAL TMaxYear == 1000000

\* A year that a property bag or a constructor gives, as a TLC integer, or past TMaxYear either way
\* where it's beyond it.
LOCAL TYearOf(value) ==
  CASE TLess(TBig(TMaxYear), value) -> TMaxYear + 1
    [] TLess(value, TBig(-TMaxYear)) -> -TMaxYear - 1
    [] OTHER -> TSmall(value)

\* An integer as a TLC integer that keeps every comparison with a field's bounds.
LOCAL TFieldOf(value) ==
  CASE TLess(TBig(1000000000), value) -> 1000000001
    [] TLess(value, TBig(-1000000000)) -> -1000000001
    [] OTHER -> TSmall(value)

LOCAL TIsYearKept(year) == year >= -TMaxYear /\ year <= TMaxYear

\* RegulateISODate, where a year past TMaxYear is out of limits, which throws.
LOCAL TRegulateDate(year, month, day, overflow) ==
  LET clampedMonth == IF month < 1 THEN 1 ELSE IF month > 12 THEN 12 ELSE month
      clampedDay == IF day < 1 THEN 1
                    ELSE IF day > TDaysInMonth(year, clampedMonth) THEN TDaysInMonth(year, clampedMonth)
                    ELSE day
  IN CASE ~TIsYearKept(year) -> TFail("RangeError")
       [] overflow = "constrain" -> TOk(<<year, clampedMonth, clampedDay>>)
       [] TIsValidDate(year, month, day) -> TOk(<<year, month, day>>)
       [] OTHER -> TFail("RangeError")

LOCAL TIsValidTime(time) ==
  /\ time[1] >= 0 /\ time[1] <= 23 /\ time[2] >= 0 /\ time[2] <= 59 /\ time[3] >= 0 /\ time[3] <= 59
  /\ time[4] >= 0 /\ time[4] <= 999 /\ time[5] >= 0 /\ time[5] <= 999 /\ time[6] >= 0 /\ time[6] <= 999

\* RegulateTime.
LOCAL TRegulateTime(time, overflow) ==
  LET maximum == <<23, 59, 59, 999, 999, 999>>
      clamp(position) == IF time[position] < 0 THEN 0
                         ELSE IF time[position] > maximum[position] THEN maximum[position]
                         ELSE time[position]
  IN CASE overflow = "constrain" -> TOk([position \in 1..6 |-> clamp(position)])
       [] TIsValidTime(time) -> TOk(time)
       [] OTHER -> TFail("RangeError")

\* The nanoseconds since midnight of a time.
LOCAL TTimeNs(time) ==
  BigIntAdd(BigIntMultiply(TBig((time[1] * 60 + time[2]) * 60 + time[3]), TNsPerSecond),
            TBig((time[4] * 1000 + time[5]) * 1000 + time[6]))

\* BalanceTime of a time and nanoseconds to add, as the days that it carries and the time.
LOCAL TBalanceTime(time, extra) ==
  LET total == BigIntAdd(TTimeNs(time), extra)
      rest == TModulo(total, TNsPerDay)
      seconds == TSmall(BigIntDivide(rest, TNsPerSecond))
      fraction == TSmall(BigIntRemainder(rest, TNsPerSecond))
  IN [days |-> TFloorDivide(total, TNsPerDay),
      time |-> <<seconds \div 3600, (seconds \div 60) % 60, seconds % 60, fraction \div 1000000,
                 (fraction \div 1000) % 1000, fraction % 1000>>]

\* RoundTime, as the days that it carries and the time.
LOCAL TRoundTime(time, increment, unit, mode) ==
  LET total == TTimeNs(time)
      parentLength == CASE unit = "minute" -> TNsPerHour
                        [] unit = "second" -> TNsPerMinute
                        [] unit = "millisecond" -> TNsPerSecond
                        [] unit = "microsecond" -> Big :> 1000000
                        [] OTHER -> Big :> 1000
      base == IF unit \in {"day", "hour"}
              THEN Big :> 0
              ELSE BigIntSubtract(total, TModulo(total, parentLength))
      rounded == TRoundToIncrement(BigIntSubtract(total, base),
                                   BigIntMultiply(increment, TUnitLength(unit)), mode)
  IN TBalanceTime(TMidnight, BigIntAdd(base, rounded))

\* The epoch nanoseconds of a date and a time in UTC.
LOCAL TEpochNs(date, time) == BigIntAdd(BigIntMultiply(TBig(TEpochDays(date)), TNsPerDay), TTimeNs(time))

\* PadISOYear.
LOCAL TYearText(year) ==
  IF year >= 0 /\ year <= 9999
  THEN TPadded(ToString(year), 4)
  ELSE (IF year > 0 THEN "+" ELSE "-") \o TPadded(ToString(IF year < 0 THEN -year ELSE year), 6)

LOCAL TTwoDigits(value) == TPadded(ToString(value), 2)

LOCAL TDateText(date) == TYearText(date[1]) \o "-" \o TTwoDigits(date[2]) \o "-" \o TTwoDigits(date[3])

\* FormatTimeString of a time, with precision a count, -1 for auto, or -2 for minute.
LOCAL TTimeText(time, precision) ==
  TTwoDigits(time[1]) \o ":" \o TTwoDigits(time[2])
    \o (IF precision = -2
        THEN ""
        ELSE ":" \o TTwoDigits(time[3])
               \o TFractionalSeconds((time[4] * 1000 + time[5]) * 1000 + time[6], precision))

LOCAL TMonthCode(month) == "M" \o TTwoDigits(month)

\* FormatCalendarAnnotation.
LOCAL TCalendarText(calendar, show) ==
  CASE show = "never" -> ""
    [] show = "auto" /\ calendar = "iso8601" -> ""
    [] OTHER -> "[" \o (IF show = "critical" THEN "!" ELSE "") \o "u-ca=" \o calendar \o "]"

\* ---------------------------------------------------------------------------------------------
\* RFC 9557 and ISO 8601 strings, as ParseISODateTime reads them.

LOCAL TDigitsAt(text, position, count) ==
  \A offset \in 0..(count - 1) : TIsDigit(TCharacter(text, position + offset))

LOCAL TValueAt(text, position, count) == ParseDigits(SubSeq(text, position, position + count - 1), 10)

LOCAL TTwoAt(text, position, low, high) ==
  TDigitsAt(text, position, 2) /\ TValueAt(text, position, 2) >= low /\ TValueAt(text, position, 2) <= high

LOCAL TNoParse == [ok |-> FALSE, end |-> 0]

\* A decimal fraction at a position, its separator first, as its digits and where it ends.
LOCAL TFractionAt(text, position) ==
  LET run == TemporalDigitRun(text, position + 1)
  IN IF TCharacter(text, position) \in {".", ","} /\ run >= 1 /\ run <= 9
     THEN [ok |-> TRUE, end |-> position + 1 + run, digits |-> SubSeq(text, position + 1, position + run)]
     ELSE [ok |-> FALSE, end |-> position, digits |-> ""]

\* Hour, MinuteSecond, and TimeSecond with an optional fraction, in basic or extended format, as
\* where it ends and the time.
LOCAL TTimeAt(text, position) ==
  LET separator == IF TCharacter(text, position + 2) = ":" THEN ":" ELSE ""
      minuteAt == position + 2 + Len(separator)
      hasMinute == separator = ":" \/ TIsDigit(TCharacter(text, minuteAt))
      secondSeparatorAt == minuteAt + 2
      hasSecond == hasMinute /\ IF separator = ":"
                                THEN TCharacter(text, secondSeparatorAt) = ":"
                                ELSE TIsDigit(TCharacter(text, secondSeparatorAt))
      secondAt == secondSeparatorAt + Len(separator)
      fraction == TFractionAt(text, secondAt + 2)
      isValid ==
        /\ TTwoAt(text, position, 0, 23)
        /\ hasMinute => TTwoAt(text, minuteAt, 0, 59)
        /\ hasSecond => TTwoAt(text, secondAt, 0, 60)
      digits == (IF hasSecond /\ fraction.ok THEN fraction.digits ELSE "") \o "000000000"
      second == IF hasSecond THEN TValueAt(text, secondAt, 2) ELSE 0
  IN IF ~isValid
     THEN TNoParse
     ELSE [ok |-> TRUE,
           end |-> CASE ~hasMinute -> position + 2
                     [] ~hasSecond -> minuteAt + 2
                     [] fraction.ok -> fraction.end
                     [] OTHER -> secondAt + 2,
           time |-> <<TValueAt(text, position, 2), IF hasMinute THEN TValueAt(text, minuteAt, 2) ELSE 0,
                      IF second = 60 THEN 59 ELSE second, TValueAt(digits, 1, 3), TValueAt(digits, 4, 3),
                      TValueAt(digits, 7, 3)>>]

\* UTCOffset, with seconds and a fraction where isSubMinute, as where it ends, its nanoseconds, and
\* whether it has seconds.
LOCAL TOffsetAt(text, position, isSubMinute) ==
  LET sign == TCharacter(text, position)
      hourAt == position + 1
      separator == IF TCharacter(text, hourAt + 2) = ":" THEN ":" ELSE ""
      minuteAt == hourAt + 2 + Len(separator)
      hasMinute == separator = ":" \/ TIsDigit(TCharacter(text, minuteAt))
      secondSeparatorAt == minuteAt + 2
      hasSecond == isSubMinute /\ hasMinute /\ IF separator = ":"
                                               THEN TCharacter(text, secondSeparatorAt) = ":"
                                               ELSE TIsDigit(TCharacter(text, secondSeparatorAt))
      secondAt == secondSeparatorAt + Len(separator)
      fraction == TFractionAt(text, secondAt + 2)
      isValid ==
        /\ sign \in {"+", "-"}
        /\ TTwoAt(text, hourAt, 0, 23)
        /\ hasMinute => TTwoAt(text, minuteAt, 0, 59)
        /\ hasSecond => TTwoAt(text, secondAt, 0, 59)
      digits == (IF hasSecond /\ fraction.ok THEN fraction.digits ELSE "") \o "000000000"
      seconds == (TValueAt(text, hourAt, 2) * 60 + IF hasMinute THEN TValueAt(text, minuteAt, 2) ELSE 0) * 60
                   + IF hasSecond THEN TValueAt(text, secondAt, 2) ELSE 0
      magnitude == BigIntAdd(BigIntMultiply(TBig(seconds), TNsPerSecond), TBig(TValueAt(digits, 1, 9)))
  IN IF ~isValid
     THEN TNoParse
     ELSE [ok |-> TRUE,
           end |-> CASE ~hasMinute -> hourAt + 2
                     [] ~hasSecond -> minuteAt + 2
                     [] fraction.ok -> fraction.end
                     [] OTHER -> secondAt + 2,
           ns |-> IF sign = "-" THEN BigIntNegate(magnitude) ELSE magnitude,
           hasSecond |-> hasSecond]

\* DateYear, as where it ends and the year.
LOCAL TYearAt(text, position) ==
  CASE TCharacter(text, position) \in {"+", "-"} ->
         IF TDigitsAt(text, position + 1, 6) /\ SubSeq(text, position, position + 6) # "-000000"
         THEN [ok |-> TRUE, end |-> position + 7,
               year |-> (IF TCharacter(text, position) = "-" THEN -1 ELSE 1) * TValueAt(text, position + 1, 6)]
         ELSE TNoParse
    [] TDigitsAt(text, position, 4) -> [ok |-> TRUE, end |-> position + 4, year |-> TValueAt(text, position, 4)]
    [] OTHER -> TNoParse

\* DateSpec, as where it ends and the date.
LOCAL TDateAt(text, position) ==
  LET year == TYearAt(text, position)
      separator == IF TCharacter(text, year.end) = "-" THEN "-" ELSE ""
      monthAt == year.end + Len(separator)
      dayAt == monthAt + 2 + Len(separator)
      isValid ==
        /\ year.ok
        /\ TTwoAt(text, monthAt, 1, 12)
        /\ (separator = "" \/ TCharacter(text, monthAt + 2) = "-")
        /\ TTwoAt(text, dayAt, 1, 31)
        /\ TIsValidDate(year.year, TValueAt(text, monthAt, 2), TValueAt(text, dayAt, 2))
  IN IF isValid
     THEN [ok |-> TRUE, end |-> dayAt + 2,
           date |-> <<year.year, TValueAt(text, monthAt, 2), TValueAt(text, dayAt, 2)>>]
     ELSE TNoParse

\* DateSpecYearMonth.
LOCAL TYearMonthAt(text, position) ==
  LET year == TYearAt(text, position)
      monthAt == year.end + (IF TCharacter(text, year.end) = "-" THEN 1 ELSE 0)
  IN IF year.ok /\ TTwoAt(text, monthAt, 1, 12)
     THEN [ok |-> TRUE, end |-> monthAt + 2, date |-> <<year.year, TValueAt(text, monthAt, 2), 1>>]
     ELSE TNoParse

\* DateSpecMonthDay.
LOCAL TMonthDayAt(text, position) ==
  LET monthAt == IF TCharacter(text, position) = "-" /\ TCharacter(text, position + 1) = "-" THEN position + 2 ELSE position
      dayAt == monthAt + 2 + (IF TCharacter(text, monthAt + 2) = "-" THEN 1 ELSE 0)
  IN IF TTwoAt(text, monthAt, 1, 12) /\ TTwoAt(text, dayAt, 1, 31)
        /\ TIsValidDate(1972, TValueAt(text, monthAt, 2), TValueAt(text, dayAt, 2))
     THEN [ok |-> TRUE, end |-> dayAt + 2, date |-> <<1972, TValueAt(text, monthAt, 2), TValueAt(text, dayAt, 2)>>]
     ELSE TNoParse

\* The position of a character in a text from a position, or 0.
RECURSIVE TemporalFind(_, _, _)
TemporalFind(text, position, character) ==
  CASE position > Len(text) -> 0
    [] TCharacter(text, position) = character -> position
    [] OTHER -> TemporalFind(text, position + 1, character)

\* The bracketed suffixes from a position to the end, each as whether it's critical and its text,
\* or a sequence that ends with one that isn't ok where the text isn't all suffixes.
RECURSIVE TemporalBrackets(_, _)
TemporalBrackets(text, position) ==
  LET close == TemporalFind(text, position, "]")
      isCritical == TCharacter(text, position + 1) = "!"
  IN CASE position > Len(text) -> <<>>
       [] TCharacter(text, position) # "[" \/ close = 0 -> <<[ok |-> FALSE, critical |-> FALSE, text |-> ""]>>
       [] OTHER -> <<[ok |-> TRUE, critical |-> isCritical,
                      text |-> SubSeq(text, position + (IF isCritical THEN 2 ELSE 1), close - 1)]>>
                     \o TemporalBrackets(text, close + 1)

LOCAL TIsAlpha(character) ==
  character # "" /\ \E position \in 1..52 :
    SubSeq("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", position, position) = character

LOCAL TIsLowercase(character) ==
  character # "" /\ \E position \in 1..26 : SubSeq("abcdefghijklmnopqrstuvwxyz", position, position) = character

LOCAL TSplit(text, separator) ==
  LET RECURSIVE Parts(_)
      Parts(rest) ==
        LET at == TemporalFind(rest, 1, separator)
        IN IF at = 0 THEN <<rest>> ELSE <<SubSeq(rest, 1, at - 1)>> \o Parts(SubSeq(rest, at + 1, Len(rest)))
  IN Parts(text)

\* TimeZoneIANAName.
LOCAL TIsZoneName(text) ==
  \A part \in {TSplit(text, "/")[position] : position \in DOMAIN TSplit(text, "/")} :
    /\ part # ""
    /\ TIsAlpha(TCharacter(part, 1)) \/ TCharacter(part, 1) \in {".", "_"}
    /\ \A position \in 1..Len(part) :
         TIsAlpha(TCharacter(part, position)) \/ TIsDigit(TCharacter(part, position))
           \/ TCharacter(part, position) \in {".", "_", "-", "+"}

\* TimeZoneIdentifier: UTCOffset without seconds, or a name.
LOCAL TIsZoneIdentifier(text) ==
  LET offset == TOffsetAt(text, 1, FALSE)
  IN \/ offset.ok /\ offset.end = Len(text) + 1
     \/ TIsZoneName(text)

\* An Annotation's key and value.
LOCAL TIsAnnotation(text) ==
  LET at == TemporalFind(text, 1, "=")
      key == SubSeq(text, 1, at - 1)
      value == SubSeq(text, at + 1, Len(text))
      parts == TSplit(value, "-")
  IN /\ at > 1
     /\ TIsLowercase(TCharacter(key, 1)) \/ TCharacter(key, 1) = "_"
     /\ \A position \in 1..Len(key) :
          TIsLowercase(TCharacter(key, position)) \/ TIsDigit(TCharacter(key, position))
            \/ TCharacter(key, position) \in {"_", "-"}
     /\ \A position \in DOMAIN parts :
          parts[position] # "" /\ \A offset \in 1..Len(parts[position]) :
            TIsAlpha(TCharacter(parts[position], offset)) \/ TIsDigit(TCharacter(parts[position], offset))

\* The suffixes from a position: TimeZoneAnnotation? Annotations?, as the time zone annotation, or "",
\* the calendar, or "", and whether a critical annotation rejects the string.
LOCAL TSuffixesAt(text, position) ==
  LET groups == TemporalBrackets(text, position)
      isZone(group) == TemporalFind(group.text, 1, "=") = 0
      hasZone == groups # <<>> /\ groups[1].ok /\ isZone(groups[1])
      annotations == IF hasZone THEN Tail(groups) ELSE groups
      keyOf(group) == SubSeq(group.text, 1, TemporalFind(group.text, 1, "=") - 1)
      calendars == SelectSeq(annotations, LAMBDA group : keyOf(group) = "u-ca")
      isValid ==
        /\ \A index \in DOMAIN groups : groups[index].ok
        /\ hasZone => TIsZoneIdentifier(groups[1].text)
        /\ \A index \in DOMAIN annotations : ~isZone(annotations[index]) /\ TIsAnnotation(annotations[index].text)
      isRejected ==
        \/ Len(calendars) > 1 /\ \E index \in DOMAIN calendars : calendars[index].critical
        \/ \E index \in DOMAIN annotations : annotations[index].critical /\ keyOf(annotations[index]) # "u-ca"
  IN IF ~isValid
     THEN [ok |-> FALSE]
     ELSE [ok |-> TRUE, zone |-> IF hasZone THEN groups[1].text ELSE "",
           calendar |-> IF calendars = <<>> THEN ""
                        ELSE SubSeq(calendars[1].text, Len("u-ca=") + 1, Len(calendars[1].text)),
           isRejected |-> isRejected]

\* An ISO Date-Time Parse Record, of a date, a time where hasTime, and a time zone.
LOCAL TParsed(date, hasYear, hasTime, time, isZ, offset, suffixes) ==
  [ok |-> TRUE, date |-> date, hasYear |-> hasYear, hasTime |-> hasTime, time |-> time, z |-> isZ, offset |-> offset,
   zone |-> suffixes.zone, calendar |-> suffixes.calendar, isRejected |-> suffixes.isRejected]

\* DateTime and its suffixes from a position, where offsets may be "none", "offset", "z" for an offset
\* or Z, or "required" for one that must be there.
LOCAL TDateTimeAt(text, isTimeRequired, offsets, isZoneRequired) ==
  LET date == TDateAt(text, 1)
      hasTime == date.ok /\ TCharacter(text, date.end) \in {" ", "T", "t"}
      time == TTimeAt(text, date.end + 1)
      afterTime == IF hasTime THEN time.end ELSE date.end
      hasZ == hasTime /\ offsets \in {"z", "required"} /\ TCharacter(text, afterTime) \in {"Z", "z"}
      offset == TOffsetAt(text, afterTime, TRUE)
      hasOffset == hasTime /\ offsets # "none" /\ ~hasZ /\ TCharacter(text, afterTime) \in {"+", "-"}
      afterOffset == CASE hasZ -> afterTime + 1 [] hasOffset -> offset.end [] OTHER -> afterTime
      suffixes == TSuffixesAt(text, afterOffset)
      isValid ==
        /\ date.ok
        /\ hasTime => time.ok
        /\ isTimeRequired => hasTime
        /\ hasOffset => offset.ok
        /\ offsets = "required" => hasZ \/ hasOffset
        /\ suffixes.ok
        /\ isZoneRequired => suffixes.zone # ""
  IN IF isValid
     THEN TParsed(date.date, TRUE, hasTime, IF hasTime THEN time.time ELSE TMidnight, hasZ,
                  IF hasOffset THEN SubSeq(text, afterTime, offset.end - 1) ELSE "", suffixes)
     ELSE [ok |-> FALSE]

\* AnnotatedTime without a time designator, whose time and offset mustn't read as a month and day
\* or a year and month.
LOCAL TTimeOnlyAt(text, position) ==
  LET time == TTimeAt(text, position)
      offset == TOffsetAt(text, time.end, TRUE)
      hasOffset == time.ok /\ TCharacter(text, time.end) \in {"+", "-"}
      afterOffset == IF hasOffset THEN offset.end ELSE time.end
      suffixes == TSuffixesAt(text, afterOffset)
      head == SubSeq(text, position, afterOffset - 1)
      isAmbiguous ==
        position = 1 /\ \/ TMonthDayAt(head, 1).ok /\ TMonthDayAt(head, 1).end = Len(head) + 1
                        \/ TYearMonthAt(head, 1).ok /\ TYearMonthAt(head, 1).end = Len(head) + 1
  IN IF time.ok /\ (hasOffset => offset.ok) /\ suffixes.ok /\ ~isAmbiguous
     THEN TParsed(<<1970, 1, 1>>, TRUE, TRUE, time.time, FALSE,
                  IF hasOffset THEN SubSeq(text, time.end, offset.end - 1) ELSE "", suffixes)
     ELSE [ok |-> FALSE]

LOCAL TLowercase(text) ==
  LET upper == "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
      lower == "abcdefghijklmnopqrstuvwxyz"
      convert(character) ==
        IF \E position \in 1..26 : SubSeq(upper, position, position) = character
        THEN LET position == CHOOSE position \in 1..26 : SubSeq(upper, position, position) = character
             IN SubSeq(lower, position, position)
        ELSE character
      RECURSIVE Convert(_)
      Convert(rest) == IF rest = "" THEN "" ELSE convert(SubSeq(rest, 1, 1)) \o Convert(SubSeq(rest, 2, Len(rest)))
  IN Convert(text)

\* ParseISODateTime of a goal: "DateTime", "ZonedDateTime", "Instant", "Time", "YearMonth", or
\* "MonthDay". A string that doesn't parse, or whose annotations it rejects, throws a RangeError.
LOCAL TParseISO(text, goal) ==
  LET parsed ==
        CASE goal = "DateTime" -> TDateTimeAt(text, FALSE, "offset", FALSE)
          [] goal = "ZonedDateTime" -> TDateTimeAt(text, FALSE, "z", TRUE)
          [] goal = "Instant" -> TDateTimeAt(text, TRUE, "required", FALSE)
          [] goal = "Time" ->
               IF TCharacter(text, 1) \in {"T", "t"}
               THEN TTimeOnlyAt(text, 2)
               ELSE LET bare == TTimeOnlyAt(text, 1)
                    IN IF bare.ok THEN bare ELSE TDateTimeAt(text, TRUE, "offset", FALSE)
          [] goal = "YearMonth" ->
               LET short == TYearMonthAt(text, 1)
                   suffixes == TSuffixesAt(text, short.end)
               IN IF short.ok /\ suffixes.ok
                  THEN [TParsed(short.date, TRUE, FALSE, TMidnight, FALSE, "", suffixes) EXCEPT !.isRejected =
                          @ \/ (suffixes.calendar # "" /\ TLowercase(suffixes.calendar) # "iso8601")]
                  ELSE TDateTimeAt(text, FALSE, "offset", FALSE)
          [] OTHER ->
               LET short == TMonthDayAt(text, 1)
                   suffixes == TSuffixesAt(text, short.end)
               IN IF short.ok /\ suffixes.ok
                  THEN [TParsed(short.date, FALSE, FALSE, TMidnight, FALSE, "", suffixes) EXCEPT !.isRejected =
                          @ \/ (suffixes.calendar # "" /\ TLowercase(suffixes.calendar) # "iso8601")]
                  ELSE TDateTimeAt(text, FALSE, "offset", FALSE)
  IN IF parsed.ok /\ ~parsed.isRejected THEN TOk(parsed) ELSE TFail("RangeError")

\* CanonicalizeCalendar, which tla-ts runs for the ISO 8601 calendar alone.
LOCAL TCalendar(text) ==
  IF TLowercase(text) = "iso8601"
  THEN TOk("iso8601")
  ELSE Assert(FALSE, "tla-ts can't use the calendar " \o text)

\* ---------------------------------------------------------------------------------------------
\* Reading Temporal objects and property bags.

\* An available time zone identifier: UTC or an offset, as its name and its offset in nanoseconds.
\* tla-ts doesn't read the time zone data that another named time zone needs.
LOCAL TZoneOfName(name) ==
  LET offset == TOffsetAt(name, 1, FALSE)
      minutes == TSmall(BigIntDivide(offset.ns, TNsPerMinute))
      magnitude == IF minutes < 0 THEN -minutes ELSE minutes
  IN CASE offset.ok /\ offset.end = Len(name) + 1 ->
            TOk([id |-> (IF minutes < 0 THEN "-" ELSE "+") \o TTwoDigits(magnitude \div 60) \o ":"
                          \o TTwoDigits(magnitude % 60),
                 offset |-> BigIntMultiply(TBig(minutes), TNsPerMinute)])
       [] TLowercase(name) = "utc" -> TOk([id |-> "UTC", offset |-> Big :> 0])
       [] OTHER -> Assert(FALSE, "tla-ts can't use the time zone " \o name)

\* ToTemporalTimeZoneIdentifier.
LOCAL TTimeZone(heap, value) ==
  LET goals == <<"ZonedDateTime", "DateTime", "Instant", "Time", "MonthDay", "YearMonth">>
      parsedGoals == SelectSeq(goals, LAMBDA goal : TParseISO(value, goal).error = "")
      parsed == TParseISO(value, Head(parsedGoals)).value
      offset == TOffsetAt(parsed.offset, 1, FALSE)
  IN CASE TSlots(heap, value).kind = "ZonedDateTime" -> TOk(TSlots(heap, value).zone)
       [] TypeOf(value) # "string" \/ IsRef(value) -> TFail("TypeError")
       [] TIsZoneIdentifier(value) -> TZoneOfName(value)
       [] parsedGoals = <<>> -> TFail("RangeError")
       [] parsed.zone # "" -> TZoneOfName(parsed.zone)
       [] parsed.z -> TZoneOfName("UTC")
       [] parsed.offset # "" ->
            IF offset.ok /\ offset.end = Len(parsed.offset) + 1 THEN TZoneOfName(parsed.offset) ELSE TFail("RangeError")
       [] OTHER -> TFail("RangeError")

LOCAL TOverflowOption(heap, options) ==
  TStringOf(TOption(heap, options, "overflow"), {"constrain", "reject"}, "constrain")

\* ToPositiveIntegerWithTruncation.
LOCAL TPositive(value) ==
  LET integer == TTruncated(value)
  IN IF integer.error = "" /\ ~TLess(Big :> 0, integer.value) THEN TFail("RangeError") ELSE integer

\* ParseMonthCode of a property's value, as the month code that CreateMonthCode gives.
LOCAL TMonthCodeOf(value) ==
  LET text == value
      isLeap == Len(text) = 4 /\ TCharacter(text, 4) = "L"
      digits == SubSeq(text, 2, 3)
      isValid ==
        /\ Len(text) \in {3, 4}
        /\ TCharacter(text, 1) = "M"
        /\ TDigitsAt(text, 2, 2)
        /\ Len(text) = 4 => isLeap
        /\ digits # "00" \/ isLeap
  IN CASE IsRef(value) \/ IsSequenceValue(value) ->
            Assert(FALSE, "tla-ts can't convert an object that a Temporal function reads to a string")
       [] TypeOf(value) # "string" -> TFail("TypeError")
       [] ~isValid -> TFail("RangeError")
       [] OTHER -> TOk([month |-> TValueAt(text, 2, 2), isLeap |-> isLeap])

\* The property keys of the fields, in the order that PrepareCalendarFields reads them.
LOCAL TFieldKeys ==
  <<"day", "hour", "microsecond", "millisecond", "minute", "month", "monthCode", "nanosecond", "offset",
    "second", "timeZone", "year">>

LOCAL TDateTimeKeys ==
  {"day", "hour", "microsecond", "millisecond", "minute", "month", "monthCode", "nanosecond", "second", "year"}

\* ToOffsetString, as the offset's nanoseconds.
LOCAL TOffsetString(value) ==
  LET offset == TOffsetAt(value, 1, TRUE)
  IN CASE IsRef(value) \/ IsSequenceValue(value) ->
            Assert(FALSE, "tla-ts can't convert an object that a Temporal function reads to a string")
       [] TypeOf(value) # "string" -> TFail("TypeError")
       [] offset.ok /\ offset.end = Len(value) + 1 -> TOk(offset.ns)
       [] OTHER -> TFail("RangeError")

LOCAL TTimeKeys == {"hour", "minute", "second", "millisecond", "microsecond", "nanosecond"}

\* PrepareCalendarFields for the ISO 8601 calendar, of the keys in names, as a record of each field's
\* value, or Undefined where it's unset. required is the set of keys that must be there, or any one
\* must where isPartial.
LOCAL TPrepareFields(heap, item, names, required, isPartial) ==
  LET keys == SelectSeq(TFieldKeys, LAMBDA key : key \in names)
      read == [index \in DOMAIN keys |-> TGet(heap, item, keys[index])]
      converted ==
        [index \in DOMAIN keys |->
           LET key == keys[index]
               value == read[index]
           IN CASE value = Undefined ->
                     IF ~isPartial /\ key \in required THEN TFail("TypeError") ELSE TOk(Undefined)
                [] key \in {"month", "day"} -> TPositive(value)
                [] key = "monthCode" -> TMonthCodeOf(value)
                [] key = "offset" -> TOffsetString(value)
                [] key = "timeZone" -> TTimeZone(heap, value)
                [] OTHER -> TTruncated(value)]
      error == TFirstError(converted)
      valueOf(key) ==
        IF \E index \in DOMAIN keys : keys[index] = key
        THEN converted[CHOOSE index \in DOMAIN keys : keys[index] = key].value
        ELSE Undefined
      defaulted(key) == IF ~isPartial /\ key \in TTimeKeys /\ valueOf(key) = Undefined THEN Big :> 0 ELSE valueOf(key)
  IN CASE error # "" -> TFail(error)
       [] isPartial /\ \A index \in DOMAIN keys : read[index] = Undefined -> TFail("TypeError")
       [] OTHER -> TOk([key \in {TFieldKeys[index] : index \in 1..12} |-> defaulted(key)])

\* The fields of a date, as PrepareCalendarFields gives them, with a time's fields where hasTime.
LOCAL TDateFields(date, time, hasTime) ==
  [key \in {TFieldKeys[index] : index \in 1..12} |->
     CASE key = "year" -> TBig(date[1])
       [] key = "month" -> TBig(date[2])
       [] key = "monthCode" -> [month |-> date[2], isLeap |-> FALSE]
       [] key = "day" -> TBig(date[3])
       [] ~hasTime \/ key \in {"offset", "timeZone"} -> Undefined
       [] key = "hour" -> TBig(time[1])
       [] key = "minute" -> TBig(time[2])
       [] key = "second" -> TBig(time[3])
       [] key = "millisecond" -> TBig(time[4])
       [] key = "microsecond" -> TBig(time[5])
       [] OTHER -> TBig(time[6])]

\* CalendarMergeFields for the ISO 8601 calendar, where month and monthCode replace each other.
LOCAL TMergeFields(fields, additional) ==
  LET isMonthGiven == additional["month"] # Undefined \/ additional["monthCode"] # Undefined
  IN [key \in DOMAIN fields |->
        CASE additional[key] # Undefined -> additional[key]
          [] key \in {"month", "monthCode"} /\ isMonthGiven -> Undefined
          [] OTHER -> fields[key]]

\* CalendarResolveFields for the ISO 8601 calendar, as the month that the fields give, of a type:
\* "date", "year-month", or "month-day".
LOCAL TResolveMonth(fields, type) ==
  LET code == fields["monthCode"]
  IN CASE type \in {"date", "year-month"} /\ fields["year"] = Undefined -> TFail("TypeError")
       [] type \in {"date", "month-day"} /\ fields["day"] = Undefined -> TFail("TypeError")
       [] fields["month"] = Undefined /\ code = Undefined -> TFail("TypeError")
       [] code = Undefined -> TOk(TFieldOf(fields["month"]))
       [] code.isLeap \/ code.month > 12 -> TFail("RangeError")
       [] fields["month"] # Undefined /\ TFieldOf(fields["month"]) # code.month -> TFail("RangeError")
       [] OTHER -> TOk(code.month)

\* CalendarDateFromFields for the ISO 8601 calendar.
LOCAL TDateFromFields(fields, overflow) ==
  LET month == TResolveMonth(fields, "date")
      date == TRegulateDate(TYearOf(fields["year"]), month.value, TFieldOf(fields["day"]), overflow)
  IN CASE month.error # "" -> month
       [] date.error # "" -> date
       [] ~TDateWithinLimits(date.value) -> TFail("RangeError")
       [] OTHER -> date

\* The time that the fields give, before RegulateTime.
LOCAL TTimeOfFields(fields) ==
  <<TFieldOf(fields["hour"]), TFieldOf(fields["minute"]), TFieldOf(fields["second"]),
    TFieldOf(fields["millisecond"]), TFieldOf(fields["microsecond"]), TFieldOf(fields["nanosecond"])>>

\* ToTemporalCalendarIdentifier.
LOCAL TCalendarIdentifier(heap, value) ==
  LET slots == TSlots(heap, value)
      parsed(goal) == TParseISO(value, goal)
      goals == <<"ZonedDateTime", "DateTime", "Instant", "Time", "MonthDay", "YearMonth">>
      parsedGoals == SelectSeq(goals, LAMBDA goal : parsed(goal).error = "")
      isValue ==
        /\ value # ""
        /\ \A position \in DOMAIN TSplit(value, "-") :
             TSplit(value, "-")[position] # "" /\ \A offset \in 1..Len(TSplit(value, "-")[position]) :
               TIsAlpha(TCharacter(TSplit(value, "-")[position], offset))
                 \/ TIsDigit(TCharacter(TSplit(value, "-")[position], offset))
  IN CASE slots.kind \in {"PlainDate", "PlainDateTime", "PlainYearMonth", "PlainMonthDay", "ZonedDateTime"} ->
            TOk(slots.calendar)
       [] TypeOf(value) # "string" \/ IsRef(value) -> TFail("TypeError")
       [] parsedGoals # <<>> ->
            LET calendar == parsed(Head(parsedGoals)).value.calendar
            IN IF calendar = "" THEN TOk("iso8601") ELSE TCalendar(calendar)
       [] isValue -> TCalendar(value)
       [] OTHER -> TFail("RangeError")

\* GetTemporalCalendarIdentifierWithISODefault of a property bag.
LOCAL TCalendarOfBag(heap, item) ==
  LET slots == TSlots(heap, item)
      value == TGet(heap, item, "calendar")
  IN CASE slots.kind \in {"PlainDate", "PlainDateTime", "PlainYearMonth", "PlainMonthDay", "ZonedDateTime"} ->
            TOk(slots.calendar)
       [] value = Undefined -> TOk("iso8601")
       [] OTHER -> TCalendarIdentifier(heap, value)

\* IsPartialTemporalObject.
LOCAL TIsPartial(heap, value) ==
  /\ TIsObject(heap, value)
  /\ TSlots(heap, value).kind \notin {"PlainDate", "PlainDateTime", "PlainMonthDay", "PlainTime",
                                      "PlainYearMonth", "ZonedDateTime"}
  /\ TGet(heap, value, "calendar") = Undefined
  /\ TGet(heap, value, "timeZone") = Undefined

\* ToTemporalTime, as the time.
LOCAL TToTime(heap, item, options) ==
  LET slots == TSlots(heap, item)
      resolved == TOptions(heap, options)
      overflow == TOverflowOption(heap, resolved.value)
      checked(time) == CASE resolved.error # "" -> resolved [] overflow.error # "" -> overflow [] OTHER -> TOk(time)
      fields == TPrepareFields(heap, item, TTimeKeys, {}, FALSE)
      timeKeys == SelectSeq(TFieldKeys, LAMBDA key : key \in TTimeKeys)
      anyTime == \E index \in DOMAIN timeKeys : TGet(heap, item, timeKeys[index]) # Undefined
      parsed == TParseISO(item, "Time")
  IN CASE slots.kind = "PlainTime" -> checked(slots.time)
       [] slots.kind = "PlainDateTime" -> checked(slots.time)
       [] slots.kind = "ZonedDateTime" -> checked(slots.time)
       [] TIsObject(heap, item) ->
            CASE fields.error # "" -> fields
              [] ~anyTime -> TFail("TypeError")
              [] resolved.error # "" -> resolved
              [] overflow.error # "" -> overflow
              [] OTHER -> TRegulateTime(TTimeOfFields(fields.value), overflow.value)
       [] TypeOf(item) # "string" -> TFail("TypeError")
       [] parsed.error # "" -> parsed
       [] OTHER -> checked(parsed.value.time)

\* ToTemporalDate, as the date and its calendar.
LOCAL TToDate(heap, item, options) ==
  LET slots == TSlots(heap, item)
      resolved == TOptions(heap, options)
      overflow == TOverflowOption(heap, resolved.value)
      checked(date, calendar) ==
        CASE resolved.error # "" -> resolved
          [] overflow.error # "" -> overflow
          [] OTHER -> TOk([date |-> date, calendar |-> calendar])
      calendar == TCalendarOfBag(heap, item)
      fields == TPrepareFields(heap, item, {"year", "month", "monthCode", "day"}, {}, FALSE)
      made == TDateFromFields(fields.value, overflow.value)
      parsed == TParseISO(item, "DateTime")
      parsedCalendar == IF parsed.value.calendar = "" THEN TOk("iso8601") ELSE TCalendar(parsed.value.calendar)
  IN CASE slots.kind \in {"PlainDate", "PlainDateTime", "ZonedDateTime"} -> checked(slots.date, slots.calendar)
       [] TIsObject(heap, item) ->
            CASE calendar.error # "" -> calendar
              [] fields.error # "" -> fields
              [] resolved.error # "" -> resolved
              [] overflow.error # "" -> overflow
              [] made.error # "" -> made
              [] OTHER -> TOk([date |-> made.value, calendar |-> calendar.value])
       [] TypeOf(item) # "string" -> TFail("TypeError")
       [] parsed.error # "" -> parsed
       [] parsedCalendar.error # "" -> parsedCalendar
       [] ~TDateWithinLimits(parsed.value.date) ->
            IF resolved.error # "" THEN resolved ELSE IF overflow.error # "" THEN overflow ELSE TFail("RangeError")
       [] OTHER -> checked(parsed.value.date, parsedCalendar.value)

\* GetTemporalShowCalendarNameOption.
LOCAL TCalendarNameOption(heap, options) ==
  TStringOf(TOption(heap, options, "calendarName"), {"auto", "always", "never", "critical"}, "auto")

\* GetDifferenceSettings, of a group, the disallowed units, the fallback smallest unit, and the
\* default largest unit.
LOCAL TDifferenceSettings(heap, isSince, options, group, disallowed, fallback, defaultLargest) ==
  LET largest == TUnitOption(heap, options, "largestUnit")
      increment == TRoundingIncrementOption(heap, options)
      mode == TRoundingModeOption(heap, options, "trunc")
      smallest == TUnitOption(heap, options, "smallestUnit")
      smallestUnit == IF smallest.value = "unset" THEN fallback ELSE smallest.value
      largestUnit == IF largest.value \in {"unset", "auto"} THEN TLargerUnit(defaultLargest, smallestUnit) ELSE largest.value
      maximum == TMaximumIncrement(smallestUnit)
  IN CASE largest.error # "" -> largest
       [] increment.error # "" -> increment
       [] mode.error # "" -> mode
       [] smallest.error # "" -> smallest
       [] ~TUnitValid(largest.value, group, {"auto"}) -> TFail("RangeError")
       [] largest.value \in disallowed -> TFail("RangeError")
       [] ~TUnitValid(smallest.value, group, {}) -> TFail("RangeError")
       [] smallest.value \in disallowed -> TFail("RangeError")
       [] TLargerUnit(largestUnit, smallestUnit) # largestUnit -> TFail("RangeError")
       [] maximum # 0 /\ ~TIncrementValid(increment.value, maximum, FALSE) -> TFail("RangeError")
       [] OTHER -> TOk([smallest |-> smallestUnit, largest |-> largestUnit,
                        mode |-> IF isSince THEN TNegatedMode(mode.value) ELSE mode.value,
                        increment |-> increment.value])

\* ---------------------------------------------------------------------------------------------
\* Adding and differencing dates.

LOCAL TIsLeapBig(year) ==
  TIsZero(TModulo(year, Big :> 4)) /\ (~TIsZero(TModulo(year, Big :> 100)) \/ TIsZero(TModulo(year, Big :> 400)))

\* CalendarDateAdd for the ISO 8601 calendar, of a duration's date fields, which may take the year
\* past what TLC's integers hold on the way.
LOCAL TDateAdd(date, duration, overflow) ==
  LET months == BigIntAdd(TBig(date[1] * 12 + date[2] - 1), BigIntAdd(BigIntMultiply(duration[1], Big :> 12), duration[2]))
      year == TYearOf(TFloorDivide(months, Big :> 12))
      month == TSmall(TModulo(months, Big :> 12)) + 1
      regulated == TRegulateDate(year, month, date[3], overflow)
      days == BigIntAdd(duration[4], BigIntMultiply(duration[3], Big :> 7))
      total == BigIntAdd(TBig(TEpochDays(regulated.value)), days)
  IN CASE regulated.error # "" -> regulated
       [] TLess(total, TBig(-100000001)) \/ TLess(TBig(100000000), total) -> TFail("RangeError")
       [] ~TDateWithinLimits(TDateOfDays(TSmall(total))) -> TFail("RangeError")
       [] OTHER -> TOk(TDateOfDays(TSmall(total)))

\* CompareSurpasses for the ISO 8601 calendar.
LOCAL TComparesSurpasses(sign, year, month, day, target) ==
  CASE year # target[1] -> sign * (year - target[1]) > 0
    [] month # target[2] -> sign * (month - target[2]) > 0
    [] day # target[3] -> sign * (day - target[3]) > 0
    [] OTHER -> FALSE

\* Whether adding years and months to a date surpasses another, the day of the result constrained.
LOCAL TSurpasses(sign, base, target, years, months) ==
  LET y0 == base[1] + years
      total == y0 * 12 + base[2] - 1 + months
  IN \/ TComparesSurpasses(sign, y0, base[2], base[3], target)
     \/ months # 0 /\ TComparesSurpasses(sign, total \div 12, (total % 12) + 1, base[3], target)

\* CalendarDateUntil for the ISO 8601 calendar, as a duration's date fields: the most years and then
\* months that don't pass the later date, and the days left, in weeks where largestUnit is week.
LOCAL TDateUntil(one, two, largestUnit) ==
  LET sign == -TCompareSequences(one, two)
      candidateYears == two[1] - one[1]
      years == IF largestUnit = "year"
               THEN IF TSurpasses(sign, one, two, candidateYears, 0) THEN candidateYears - sign ELSE candidateYears
               ELSE 0
      candidateMonths == (two[1] * 12 + two[2]) - ((one[1] + years) * 12 + one[2])
      months == IF largestUnit \in {"year", "month"}
                THEN IF TSurpasses(sign, one, two, years, candidateMonths) THEN candidateMonths - sign ELSE candidateMonths
                ELSE 0
      total == (one[1] + years) * 12 + one[2] - 1 + months
      intermediate == <<total \div 12, (total % 12) + 1>>
      constrained == <<intermediate[1], intermediate[2],
                       IF one[3] > TDaysInMonth(intermediate[1], intermediate[2])
                       THEN TDaysInMonth(intermediate[1], intermediate[2])
                       ELSE one[3]>>
      days == TEpochDays(two) - TEpochDays(constrained)
      weeks == IF largestUnit = "week" THEN (IF days < 0 THEN -((-days) \div 7) ELSE days \div 7) ELSE 0
  IN IF sign = 0
     THEN <<Big :> 0, Big :> 0, Big :> 0, Big :> 0>>
     ELSE <<TBig(years), TBig(months), TBig(weeks), TBig(days - weeks * 7)>>

\* CreateDateDurationRecord's validity check.
LOCAL TDateDurationValid(date) ==
  TIsValidDuration(<<date[1], date[2], date[3], date[4], Big :> 0, Big :> 0, Big :> 0, Big :> 0, Big :> 0, Big :> 0>>)

\* The epoch nanoseconds that a date duration added to a date and time gives, constrained.
LOCAL TEndNs(dateTime, duration) ==
  LET added == TDateAdd(dateTime.date, duration, "constrain")
  IN IF added.error # "" THEN added ELSE TOk(TEpochNs(added.value, dateTime.time))

\* ComputeNudgeWindow without a time zone.
LOCAL TNudgeWindow(sign, date, originNs, dateTime, increment, unit, isShifted) ==
  LET truncated(value) == TRoundToIncrement(value, increment, "trunc")
      step == BigIntMultiply(increment, TBig(sign))
      weeksStart == TDateAdd(dateTime.date, <<date[1], date[2], Big :> 0, Big :> 0>>, "constrain")
      weeksUntil == TDateUntil(weeksStart.value, TAddDays(weeksStart.value, TSmall(date[4])), "week")
      base == CASE unit = "year" -> truncated(date[1])
                [] unit = "month" -> truncated(date[2])
                [] unit = "week" -> truncated(BigIntAdd(date[3], weeksUntil[3]))
                [] OTHER -> truncated(date[4])
      r1 == IF isShifted THEN BigIntAdd(base, step) ELSE base
      r2 == BigIntAdd(r1, step)
      durationOf(r) == CASE unit = "year" -> <<r, Big :> 0, Big :> 0, Big :> 0>>
                         [] unit = "month" -> <<date[1], r, Big :> 0, Big :> 0>>
                         [] unit = "week" -> <<date[1], date[2], r, Big :> 0>>
                         [] OTHER -> <<date[1], date[2], date[3], r>>
      start == IF TIsZero(r1) THEN TOk(originNs) ELSE TEndNs(dateTime, durationOf(r1))
      end == TEndNs(dateTime, durationOf(r2))
  IN CASE unit = "week" /\ weeksStart.error # "" -> weeksStart
       [] ~TDateDurationValid(durationOf(r1)) \/ ~TDateDurationValid(durationOf(r2)) -> TFail("RangeError")
       [] start.error # "" -> start
       [] end.error # "" -> end
       [] OTHER -> TOk([r1 |-> r1, r2 |-> r2, start |-> start.value, end |-> end.value,
                        startDuration |-> durationOf(r1), endDuration |-> durationOf(r2)])

\* NudgeToCalendarUnit without a time zone, as the nudged duration's date fields, its epoch
\* nanoseconds, whether it expanded, and the total as a numerator and a denominator.
LOCAL TNudgeToCalendarUnit(sign, date, originNs, destNs, dateTime, increment, unit, mode) ==
  LET first == TNudgeWindow(sign, date, originNs, dateTime, increment, unit, FALSE)
      isInside(window) ==
        IF sign = 1
        THEN ~TLess(destNs, window.start) /\ ~TLess(window.end, destNs)
        ELSE ~TLess(destNs, window.end) /\ ~TLess(window.start, destNs)
      second == TNudgeWindow(sign, date, originNs, dateTime, increment, unit, TRUE)
      window == IF isInside(first.value) THEN first ELSE second
      numerator == BigIntSubtract(destNs, window.value.start)
      denominator == BigIntSubtract(window.value.end, window.value.start)
      isUp == CASE TIsZero(numerator) -> FALSE
                [] numerator = denominator -> TRUE
                [] OTHER -> TRoundsUp(TUnsignedMode(mode, sign < 0), BigIntDivide(TAbs(window.value.r1), increment),
                                      TAbs(numerator), TAbs(denominator))
  IN CASE first.error # "" -> first
       [] ~isInside(first.value) /\ second.error # "" -> second
       [] OTHER ->
            TOk([duration |-> IF isUp THEN window.value.endDuration ELSE window.value.startDuration,
                 time |-> Big :> 0,
                 nudged |-> IF isUp THEN window.value.end ELSE window.value.start,
                 isExpanded |-> isUp \/ ~isInside(first.value),
                 totalNumerator |-> BigIntAdd(BigIntMultiply(window.value.r1, denominator),
                                              BigIntMultiply(BigIntMultiply(numerator, increment), TBig(sign))),
                 totalDenominator |-> denominator])

\* NudgeToDayOrTime.
LOCAL TNudgeToDayOrTime(date, time, destNs, largestUnit, increment, smallestUnit, mode) ==
  LET total == BigIntAdd(time, BigIntMultiply(date[4], TNsPerDay))
      rounded == TRoundToIncrement(total, BigIntMultiply(TUnitLength(smallestUnit), increment), mode)
      wholeDays == BigIntDivide(total, TNsPerDay)
      roundedDays == BigIntDivide(rounded, TNsPerDay)
      isDate == TIsDateUnit(largestUnit)
  IN IF TLess(TMaxTimeDuration, TAbs(rounded))
     THEN TFail("RangeError")
     ELSE TOk([duration |-> <<date[1], date[2], date[3], IF isDate THEN roundedDays ELSE Big :> 0>>,
               time |-> IF isDate THEN BigIntSubtract(rounded, BigIntMultiply(roundedDays, TNsPerDay)) ELSE rounded,
               nudged |-> BigIntAdd(destNs, BigIntSubtract(rounded, total)),
               isExpanded |-> TSign(BigIntSubtract(roundedDays, wholeDays)) = TSign(total)])

\* BubbleRelativeDuration without a time zone, of a duration's date fields and time, from the unit
\* at index up to largestUnit.
RECURSIVE TemporalBubble(_, _, _, _, _, _)
TemporalBubble(sign, duration, nudgedNs, dateTime, largestUnit, index) ==
  LET unit == TUnits[index]
      date == duration.date
      step == TBig(sign)
      end == CASE unit = "year" -> <<BigIntAdd(date[1], step), Big :> 0, Big :> 0, Big :> 0>>
               [] unit = "month" -> <<date[1], BigIntAdd(date[2], step), Big :> 0, Big :> 0>>
               [] OTHER -> <<date[1], date[2], BigIntAdd(date[3], step), Big :> 0>>
      endNs == TEndNs(dateTime, end)
  IN CASE index < TUnitIndex(largestUnit) -> TOk(duration)
       [] unit = "week" /\ largestUnit # "week" -> TemporalBubble(sign, duration, nudgedNs, dateTime, largestUnit, index - 1)
       [] ~TDateDurationValid(end) -> TFail("RangeError")
       [] endNs.error # "" -> endNs
       [] TSign(BigIntSubtract(nudgedNs, endNs.value)) # -sign ->
            TemporalBubble(sign, [date |-> end, time |-> Big :> 0], nudgedNs, dateTime, largestUnit, index - 1)
       [] OTHER -> TOk(duration)

\* RoundRelativeDuration without a time zone, as the duration's date fields and time.
LOCAL TRoundRelative(date, time, originNs, destNs, dateTime, largestUnit, increment, smallestUnit, mode) ==
  LET sign == IF TDurationSign(<<date[1], date[2], date[3], date[4], time>>) < 0 THEN -1 ELSE 1
      nudge == IF TIsCalendarUnit(smallestUnit)
               THEN TNudgeToCalendarUnit(sign, date, originNs, destNs, dateTime, increment, smallestUnit, mode)
               ELSE TNudgeToDayOrTime(date, time, destNs, largestUnit, increment, smallestUnit, mode)
      startUnit == TLargerUnit(smallestUnit, "day")
      nudged == [date |-> nudge.value.duration, time |-> nudge.value.time]
  IN CASE nudge.error # "" -> nudge
       [] nudge.value.isExpanded /\ smallestUnit # "week" /\ startUnit # largestUnit ->
            TemporalBubble(sign, nudged, nudge.value.nudged, dateTime, largestUnit, TUnitIndex(startUnit) - 1)
       [] OTHER -> TOk(nudged)

\* The duration that a difference gives, negated for since.
LOCAL TDifferenceDuration(difference, largestUnit, isSince) ==
  LET made == TDurationFromInternal(difference.value.date, difference.value.time, largestUnit)
  IN CASE difference.error # "" -> difference
       [] made.error # "" -> made
       [] isSince -> TOk(TNegatedDuration(made.value))
       [] OTHER -> made

\* ---------------------------------------------------------------------------------------------
\* The methods of PlainTime, PlainDate, and PlainDateTime.

\* Temporal.PlainTime.prototype.until and since.
LOCAL TTimeDifference(heap, time, other, options, isSince) ==
  LET converted == TToTime(heap, other, Undefined)
      resolved == TOptions(heap, options)
      settings == TDifferenceSettings(heap, isSince, resolved.value, "time", {}, "nanosecond", "hour")
      difference == BigIntSubtract(TTimeNs(converted.value), TTimeNs(time))
      rounded == TRoundToIncrement(difference, BigIntMultiply(settings.value.increment,
                                                              TUnitLength(settings.value.smallest)), settings.value.mode)
  IN CASE converted.error # "" -> converted
       [] resolved.error # "" -> resolved
       [] settings.error # "" -> settings
       [] OTHER -> TDifferenceDuration(TOk([date |-> <<Big :> 0, Big :> 0, Big :> 0, Big :> 0>>, time |-> rounded]),
                                       settings.value.largest, isSince)

\* Temporal.PlainTime.prototype.round.
LOCAL TTimeRound(heap, time, roundTo) ==
  LET options == IF TypeOf(roundTo) = "string" THEN TOk(Undefined) ELSE TOptions(heap, roundTo)
      increment == TRoundingIncrementOption(heap, options.value)
      mode == TRoundingModeOption(heap, options.value, "halfExpand")
      smallest == IF TypeOf(roundTo) = "string" THEN TUnitOf(roundTo) ELSE TUnitOption(heap, options.value, "smallestUnit")
  IN CASE roundTo = Undefined -> TFail("TypeError")
       [] options.error # "" -> options
       [] increment.error # "" -> increment
       [] mode.error # "" -> mode
       [] smallest.error # "" -> smallest
       [] smallest.value = "unset" -> TFail("RangeError")
       [] ~TUnitValid(smallest.value, "time", {}) -> TFail("RangeError")
       [] ~TIncrementValid(increment.value, TMaximumIncrement(smallest.value), FALSE) -> TFail("RangeError")
       [] OTHER -> TOk(TRoundTime(time, increment.value, smallest.value, mode.value).time)

\* The options of toString with fractionalSecondDigits, roundingMode, and smallestUnit, as the
\* precision record and the rounding mode, and calendarName first where isCalendar.
LOCAL TTimeTextOptions(heap, value, isCalendar) ==
  LET options == TOptions(heap, value)
      show == TCalendarNameOption(heap, options.value)
      digits == TDigitsOption(heap, options.value)
      mode == TRoundingModeOption(heap, options.value, "trunc")
      smallest == TUnitOption(heap, options.value, "smallestUnit")
  IN CASE options.error # "" -> options
       [] isCalendar /\ show.error # "" -> show
       [] digits.error # "" -> digits
       [] mode.error # "" -> mode
       [] smallest.error # "" -> smallest
       [] ~TUnitValid(smallest.value, "time", {}) \/ smallest.value = "hour" -> TFail("RangeError")
       [] OTHER -> TOk([precision |-> TPrecision(smallest.value, digits.value), mode |-> mode.value,
                        show |-> IF isCalendar THEN show.value ELSE "auto"])

\* Temporal.PlainTime.prototype.with.
LOCAL TTimeWith(heap, time, like, options) ==
  LET partial == TPrepareFields(heap, like, TTimeKeys, {}, TRUE)
      merged == [key \in DOMAIN partial.value |->
                   IF partial.value[key] # Undefined THEN partial.value[key]
                   ELSE CASE key = "hour" -> TBig(time[1]) [] key = "minute" -> TBig(time[2])
                          [] key = "second" -> TBig(time[3]) [] key = "millisecond" -> TBig(time[4])
                          [] key = "microsecond" -> TBig(time[5]) [] OTHER -> TBig(time[6])]
      resolved == TOptions(heap, options)
      overflow == TOverflowOption(heap, resolved.value)
  IN CASE ~TIsPartial(heap, like) -> TFail("TypeError")
       [] partial.error # "" -> partial
       [] resolved.error # "" -> resolved
       [] overflow.error # "" -> overflow
       [] OTHER -> TRegulateTime(TTimeOfFields(merged), overflow.value)

\* The time that adding a duration's time fields to a time gives.
LOCAL TTimeAdd(heap, time, other, isSubtract) ==
  LET converted == TToDuration(heap, other)
      fields == IF isSubtract THEN TNegatedDuration(converted.value) ELSE converted.value
  IN IF converted.error # "" THEN converted ELSE TOk(TBalanceTime(time, TTimeOf(fields)).time)

\* AddDurationToDate.
LOCAL TDateAddDuration(heap, date, other, options, isSubtract) ==
  LET converted == TToDuration(heap, other)
      fields == IF isSubtract THEN TNegatedDuration(converted.value) ELSE converted.value
      total == BigIntAdd(TTimeOf(fields), BigIntMultiply(fields[4], TNsPerDay))
      resolved == TOptions(heap, options)
      overflow == TOverflowOption(heap, resolved.value)
  IN CASE converted.error # "" -> converted
       [] resolved.error # "" -> resolved
       [] overflow.error # "" -> overflow
       [] OTHER -> TDateAdd(date, <<fields[1], fields[2], fields[3], BigIntDivide(total, TNsPerDay)>>, overflow.value)

\* Temporal.PlainDate.prototype.until and since.
LOCAL TDateDifference(heap, date, calendar, other, options, isSince) ==
  LET converted == TToDate(heap, other, Undefined)
      resolved == TOptions(heap, options)
      settings == TDifferenceSettings(heap, isSince, resolved.value, "date", {}, "day", "day")
      dates == TDateUntil(date, converted.value.date, settings.value.largest)
      isRounded == settings.value.smallest # "day" \/ settings.value.increment # Big :> 1
      rounded == TRoundRelative(dates, Big :> 0, TEpochNs(date, TMidnight), TEpochNs(converted.value.date, TMidnight),
                                [date |-> date, time |-> TMidnight], settings.value.largest,
                                settings.value.increment, settings.value.smallest, settings.value.mode)
  IN CASE converted.error # "" -> converted
       [] converted.value.calendar # calendar -> TFail("RangeError")
       [] resolved.error # "" -> resolved
       [] settings.error # "" -> settings
       [] TCompareSequences(date, converted.value.date) = 0 -> TOk(TZeroDuration)
       [] isRounded -> TDifferenceDuration(rounded, "day", isSince)
       [] OTHER -> TDifferenceDuration(TOk([date |-> dates, time |-> Big :> 0]), "day", isSince)

\* Temporal.PlainDate.prototype.with, as the date.
LOCAL TDateWith(heap, date, like, options) ==
  LET partial == TPrepareFields(heap, like, {"year", "month", "monthCode", "day"}, {}, TRUE)
      resolved == TOptions(heap, options)
      overflow == TOverflowOption(heap, resolved.value)
  IN CASE ~TIsPartial(heap, like) -> TFail("TypeError")
       [] partial.error # "" -> partial
       [] resolved.error # "" -> resolved
       [] overflow.error # "" -> overflow
       [] OTHER -> TDateFromFields(TMergeFields(TDateFields(date, TMidnight, FALSE), partial.value), overflow.value)

\* The time of a constructor's arguments from a position, each undefined as 0.
LOCAL TTimeArguments(arguments, first) ==
  [position \in 1..6 |->
     IF TArgument(arguments, first + position - 1) = Undefined
     THEN TOk(Big :> 0)
     ELSE TTruncated(TArgument(arguments, first + position - 1))]

\* A constructor's calendar argument.
LOCAL TCalendarArgument(value) ==
  CASE value = Undefined -> TOk("iso8601")
    [] TypeOf(value) # "string" \/ IsRef(value) -> TFail("TypeError")
    [] OTHER -> TCalendar(value)

\* ---------------------------------------------------------------------------------------------
\* Instants, year-months, and month-days.

\* ---------------------------------------------------------------------------------------------

LOCAL TObject(prototype, slots) == [EmptyObject EXCEPT !.prototype = prototype] @@ [temporal |-> slots]

\* What a Temporal function gives: the error that it throws, or "", the heap after it, and its value.
LOCAL TGives(heap, step) == [error |-> step.error, heap |-> heap, value |-> step.value]

\* A duration's slots, with what its getters give.
LOCAL TDurationSlots(fields) ==
  [kind |-> "Duration",
   fields |-> fields,
   getters |-> [name \in {TDurationKeys[position] : position \in 1..10} \cup {"sign", "blank"} |->
                  CASE name = "sign" -> TDurationSign(fields)
                    [] name = "blank" -> TDurationSign(fields) = 0
                    [] OTHER -> NumberOfBigInt(fields[CHOOSE position \in 1..10 : TDurationKeys[position] = name])]]

LOCAL TTimeGetters(time) ==
  [hour |-> time[1], minute |-> time[2], second |-> time[3], millisecond |-> time[4],
   microsecond |-> time[5], nanosecond |-> time[6]]

LOCAL TDateGetters(date, calendar) ==
  LET week == TWeekOfYear(date)
  IN [calendarId |-> calendar, era |-> Undefined, eraYear |-> Undefined, year |-> date[1],
      month |-> date[2], monthCode |-> TMonthCode(date[2]), day |-> date[3], dayOfWeek |-> TDayOfWeek(date),
      dayOfYear |-> TDayOfYear(date), weekOfYear |-> week[1], yearOfWeek |-> week[2], daysInWeek |-> 7,
      daysInMonth |-> TDaysInMonth(date[1], date[2]), daysInYear |-> TDaysInYear(date[1]),
      monthsInYear |-> 12, inLeapYear |-> TIsLeapYear(date[1])]

\* The slots of a Temporal object of a kind, from what a step gives: a duration's fields, a time, or
\* a record of a date, a time, and a calendar.
LOCAL TSlotsOf(kind, value) ==
  CASE kind = "Duration" -> TDurationSlots(value)
    [] kind = "PlainTime" -> [kind |-> kind, time |-> value, getters |-> TTimeGetters(value)]
    [] kind = "PlainDate" ->
         [kind |-> kind, date |-> value.date, calendar |-> value.calendar,
          getters |-> TDateGetters(value.date, value.calendar)]

\* The heap with a new Temporal object of a kind whose slots a step gives, and the object.
LOCAL TMakes(heap, prototype, kind, step) ==
  IF step.error # ""
  THEN TGives(heap, step)
  ELSE LET made == Allocate(heap, TObject(prototype, TSlotsOf(kind, step.value)))
       IN [error |-> "", heap |-> made, value |-> Allocated(made)]

LOCAL TDateOf(step, calendar) == IF step.error # "" THEN step ELSE TOk([date |-> step.value, calendar |-> calendar])

\* new of a Temporal constructor.
TemporalNew(heap, kind, arguments, prototype) ==
  CASE kind = "Duration" ->
         LET converted == [position \in 1..10 |->
                             IF TArgument(arguments, position) = Undefined
                             THEN TOk(Big :> 0)
                             ELSE TIntegral(TArgument(arguments, position))]
             error == TFirstError(converted)
         IN TMakes(heap, prototype, kind,
                   IF error # "" THEN TFail(error)
                   ELSE TCheckedDuration([position \in 1..10 |-> converted[position].value]))
    [] kind = "PlainTime" ->
         LET converted == TTimeArguments(arguments, 1)
             error == TFirstError(converted)
             time == [position \in 1..6 |-> TFieldOf(converted[position].value)]
         IN TMakes(heap, prototype, kind,
                   CASE error # "" -> TFail(error)
                     [] ~TIsValidTime(time) -> TFail("RangeError")
                     [] OTHER -> TOk(time))
    [] kind = "PlainDate" ->
         LET converted == [position \in 1..3 |-> TTruncated(TArgument(arguments, position))]
                            \o (IF kind = "PlainDate" THEN <<>> ELSE TTimeArguments(arguments, 4))
             error == TFirstError(converted)
             calendar == TCalendarArgument(TArgument(arguments, IF kind = "PlainDate" THEN 4 ELSE 10))
             date == <<TYearOf(converted[1].value), TFieldOf(converted[2].value), TFieldOf(converted[3].value)>>
             time == IF kind = "PlainDate" THEN TMidnight ELSE [position \in 1..6 |-> TFieldOf(converted[position + 3].value)]
         IN TMakes(heap, prototype, kind,
                   CASE error # "" -> TFail(error)
                     [] calendar.error # "" -> calendar
                     [] ~TIsYearKept(date[1]) \/ ~TIsValidDate(date[1], date[2], date[3]) -> TFail("RangeError")
                     [] ~TIsValidTime(time) -> TFail("RangeError")
                     [] kind = "PlainDate" /\ ~TDateWithinLimits(date) -> TFail("RangeError")
                     [] ~TDateTimeWithinLimits(date, time) -> TFail("RangeError")
                     [] OTHER -> TOk([date |-> date, time |-> time, calendar |-> calendar.value]))
    [] OTHER -> Assert(FALSE, "tla-ts can't construct a Temporal." \o kind)

\* The heap once new of a Temporal constructor that an expression evaluates makes its object, where
\* it doesn't throw, as only a statement throws.
TemporalAllocate(heap, kind, callee, arguments, prototype) ==
  LET made == TemporalNew(heap, kind, arguments, prototype)
  IN CASE ~SameValue(callee, Ref :> ("Temporal." \o kind)) ->
            Assert(FALSE, "tla-ts can't call Temporal." \o kind \o " where a script replaced it")
       [] made.error # "" ->
            Assert(FALSE, "tla-ts can't throw the " \o made.error \o " of new Temporal." \o kind \o " here")
       [] OTHER -> made.heap

\* A call of a Temporal constructor's function, such as from or compare.
TemporalStatic(heap, kind, method, arguments, prototype) ==
  LET first == TArgument(arguments, 1)
      second == TArgument(arguments, 2)
  IN CASE kind = "Duration" /\ method = "from" -> TMakes(heap, prototype, kind, TToDuration(heap, first))
       [] kind = "Duration" /\ method = "compare" ->
            TGives(heap, TDurationCompare(heap, first, second, TArgument(arguments, 3)))
       [] kind = "PlainTime" /\ method = "from" -> TMakes(heap, prototype, kind, TToTime(heap, first, second))
       [] kind = "PlainTime" /\ method = "compare" ->
            LET one == TToTime(heap, first, Undefined)
                two == TToTime(heap, second, Undefined)
            IN TGives(heap, CASE one.error # "" -> one [] two.error # "" -> two
                              [] OTHER -> TOk(TCompareSequences(one.value, two.value)))
       [] kind = "PlainDate" /\ method = "from" -> TMakes(heap, prototype, kind, TToDate(heap, first, second))
       [] kind = "PlainDate" /\ method = "compare" ->
            LET one == TToDate(heap, first, Undefined)
                two == TToDate(heap, second, Undefined)
            IN TGives(heap, CASE one.error # "" -> one [] two.error # "" -> two
                              [] OTHER -> TOk(TCompareSequences(one.value.date, two.value.date)))
       [] OTHER -> Assert(FALSE, "tla-ts can't call Temporal." \o kind \o "." \o method)

\* A call of Temporal.Duration.prototype's method.
LOCAL TDurationMethod(heap, slots, method, arguments, prototype) ==
  LET fields == slots.fields
      first == TArgument(arguments, 1)
      partial == TPartialDuration(heap, first)
  IN CASE method = "negated" -> TMakes(heap, prototype, "Duration", TOk(TNegatedDuration(fields)))
       [] method = "abs" -> TMakes(heap, prototype, "Duration", TOk([position \in 1..10 |-> TAbs(fields[position])]))
       [] method = "with" ->
            TMakes(heap, prototype, "Duration",
                   IF partial.error # "" THEN partial
                   ELSE TCheckedDuration([position \in 1..10 |->
                                            IF partial.value[position] = Undefined
                                            THEN fields[position]
                                            ELSE partial.value[position]]))
       [] method = "add" -> TMakes(heap, prototype, "Duration", TDurationAdd(heap, fields, first, FALSE))
       [] method = "subtract" -> TMakes(heap, prototype, "Duration", TDurationAdd(heap, fields, first, TRUE))
       [] method = "round" -> TMakes(heap, prototype, "Duration", TDurationRound(heap, fields, first))
       [] method = "total" -> TGives(heap, TDurationTotal(heap, fields, first))
       [] method = "toString" -> TGives(heap, TDurationToString(heap, fields, first))
       [] method = "toJSON" -> TGives(heap, TOk(TDurationText(fields, -1)))

\* A call of Temporal.PlainTime.prototype's method.
LOCAL TTimeMethod(heap, slots, method, arguments, prototype) ==
  LET time == slots.time
      first == TArgument(arguments, 1)
      second == TArgument(arguments, 2)
      other == TToTime(heap, first, Undefined)
      options == TTimeTextOptions(heap, first, FALSE)
      rounded == TRoundTime(time, TBig(options.value.precision.increment), options.value.precision.unit,
                            options.value.mode)
  IN CASE method = "add" -> TMakes(heap, prototype, "PlainTime", TTimeAdd(heap, time, first, FALSE))
       [] method = "subtract" -> TMakes(heap, prototype, "PlainTime", TTimeAdd(heap, time, first, TRUE))
       [] method = "with" -> TMakes(heap, prototype, "PlainTime", TTimeWith(heap, time, first, second))
       [] method = "until" -> TMakes(heap, prototype, "Duration", TTimeDifference(heap, time, first, second, FALSE))
       [] method = "since" -> TMakes(heap, prototype, "Duration", TTimeDifference(heap, time, first, second, TRUE))
       [] method = "round" -> TMakes(heap, prototype, "PlainTime", TTimeRound(heap, time, first))
       [] method = "equals" ->
            TGives(heap, IF other.error # "" THEN other ELSE TOk(TCompareSequences(time, other.value) = 0))
       [] method = "toString" ->
            TGives(heap, IF options.error # "" THEN options
                         ELSE TOk(TTimeText(rounded.time, options.value.precision.precision)))
       [] method = "toJSON" -> TGives(heap, TOk(TTimeText(time, -1)))

\* A call of Temporal.PlainDate.prototype's method.
LOCAL TDateMethod(heap, slots, method, arguments, prototype) ==
  LET date == slots.date
      calendar == slots.calendar
      first == TArgument(arguments, 1)
      second == TArgument(arguments, 2)
      other == TToDate(heap, first, Undefined)
      options == TOptions(heap, first)
      show == TCalendarNameOption(heap, options.value)
      time == IF first = Undefined THEN TOk(TMidnight) ELSE TToTime(heap, first, Undefined)
      withCalendar == TCalendarIdentifier(heap, first)
  IN CASE method = "add" ->
            TMakes(heap, prototype, "PlainDate", TDateOf(TDateAddDuration(heap, date, first, second, FALSE), calendar))
       [] method = "subtract" ->
            TMakes(heap, prototype, "PlainDate", TDateOf(TDateAddDuration(heap, date, first, second, TRUE), calendar))
       [] method = "with" -> TMakes(heap, prototype, "PlainDate", TDateOf(TDateWith(heap, date, first, second), calendar))
       [] method = "withCalendar" ->
            TMakes(heap, prototype, "PlainDate",
                   IF withCalendar.error # "" THEN withCalendar ELSE TOk([date |-> date, calendar |-> withCalendar.value]))
       [] method = "until" ->
            TMakes(heap, prototype, "Duration", TDateDifference(heap, date, calendar, first, second, FALSE))
       [] method = "since" ->
            TMakes(heap, prototype, "Duration", TDateDifference(heap, date, calendar, first, second, TRUE))
       [] method = "equals" ->
            TGives(heap, IF other.error # "" THEN other
                         ELSE TOk(TCompareSequences(date, other.value.date) = 0 /\ calendar = other.value.calendar))
       [] method = "toPlainDateTime" ->
            TMakes(heap, prototype, "PlainDateTime",
                   CASE time.error # "" -> time
                     [] ~TDateTimeWithinLimits(date, time.value) -> TFail("RangeError")
                     [] OTHER -> TOk([date |-> date, time |-> time.value, calendar |-> calendar]))
       [] method = "toString" ->
            TGives(heap, CASE options.error # "" -> options
                           [] show.error # "" -> show
                           [] OTHER -> TOk(TDateText(date) \o TCalendarText(calendar, show.value)))
       [] method = "toJSON" -> TGives(heap, TOk(TDateText(date) \o TCalendarText(calendar, "auto")))

\* A call of a Temporal prototype's method on a receiver.
TemporalMethod(heap, kind, method, receiver, arguments, prototype) ==
  LET slots == TSlots(heap, receiver)
  IN CASE method = "valueOf" -> TGives(heap, TFail("TypeError"))
       [] slots.kind # kind -> TGives(heap, TFail("TypeError"))
       [] kind = "Duration" -> TDurationMethod(heap, slots, method, arguments, prototype)
       [] kind = "PlainTime" -> TTimeMethod(heap, slots, method, arguments, prototype)
       [] kind = "PlainDate" -> TDateMethod(heap, slots, method, arguments, prototype)
`;
