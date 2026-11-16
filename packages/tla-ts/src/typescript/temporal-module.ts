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

LOCAL TObject(prototype, slots) == [EmptyObject EXCEPT !.prototype = prototype] @@ [temporal |-> slots]

\* What a Temporal function gives: the error that it throws, or "", the heap after it, and its value.
LOCAL TGives(heap, step) == [error |-> step.error, heap |-> heap, value |-> step.value]

\* The heap with a new Temporal object of slots that a step gives, and the object.
LOCAL TMakes(heap, prototype, step) ==
  IF step.error # ""
  THEN TGives(heap, step)
  ELSE LET made == Allocate(heap, TObject(prototype, step.value))
       IN [error |-> "", heap |-> made, value |-> Allocated(made)]

\* A duration's slots, with what its getters give.
LOCAL TDurationSlots(fields) ==
  [kind |-> "Duration",
   fields |-> fields,
   getters |-> [name \in {TDurationKeys[position] : position \in 1..10} \cup {"sign", "blank"} |->
                  CASE name = "sign" -> TDurationSign(fields)
                    [] name = "blank" -> TDurationSign(fields) = 0
                    [] OTHER -> NumberOfBigInt(fields[CHOOSE position \in 1..10 : TDurationKeys[position] = name])]]

LOCAL TMakesDuration(heap, prototype, step) ==
  TMakes(heap, prototype, IF step.error # "" THEN step ELSE TOk(TDurationSlots(step.value)))

\* new of a Temporal constructor.
TemporalNew(heap, kind, arguments, prototype) ==
  CASE kind = "Duration" ->
         LET converted == [position \in 1..10 |->
                             IF TArgument(arguments, position) = Undefined
                             THEN TOk(Big :> 0)
                             ELSE TIntegral(TArgument(arguments, position))]
             error == TFirstError(converted)
         IN TMakesDuration(heap, prototype,
                           IF error # "" THEN TFail(error)
                           ELSE TCheckedDuration([position \in 1..10 |-> converted[position].value]))
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
  CASE kind = "Duration" /\ method = "from" ->
         TMakesDuration(heap, prototype, TToDuration(heap, TArgument(arguments, 1)))
    [] kind = "Duration" /\ method = "compare" ->
         TGives(heap, TDurationCompare(heap, TArgument(arguments, 1), TArgument(arguments, 2),
                                       TArgument(arguments, 3)))
    [] OTHER -> Assert(FALSE, "tla-ts can't call Temporal." \o kind \o "." \o method)

\* A call of a Temporal prototype's method on a receiver.
TemporalMethod(heap, kind, method, receiver, arguments, prototype) ==
  LET slots == TSlots(heap, receiver)
      first == TArgument(arguments, 1)
  IN CASE method = "valueOf" -> TGives(heap, TFail("TypeError"))
       [] slots.kind # kind -> TGives(heap, TFail("TypeError"))
       [] kind = "Duration" ->
            LET fields == slots.fields
            IN CASE method = "negated" -> TMakesDuration(heap, prototype, TOk(TNegatedDuration(fields)))
                 [] method = "abs" ->
                      TMakesDuration(heap, prototype, TOk([position \in 1..10 |-> TAbs(fields[position])]))
                 [] method = "with" ->
                      LET partial == TPartialDuration(heap, first)
                      IN TMakesDuration(heap, prototype,
                                        IF partial.error # "" THEN partial
                                        ELSE TCheckedDuration([position \in 1..10 |->
                                                                 IF partial.value[position] = Undefined
                                                                 THEN fields[position]
                                                                 ELSE partial.value[position]]))
                 [] method = "add" -> TMakesDuration(heap, prototype, TDurationAdd(heap, fields, first, FALSE))
                 [] method = "subtract" -> TMakesDuration(heap, prototype, TDurationAdd(heap, fields, first, TRUE))
                 [] method = "round" -> TMakesDuration(heap, prototype, TDurationRound(heap, fields, first))
                 [] method = "total" -> TGives(heap, TDurationTotal(heap, fields, first))
                 [] method = "toString" -> TGives(heap, TDurationToString(heap, fields, first))
                 [] method = "toJSON" -> TGives(heap, TOk(TDurationText(fields, -1)))
                 [] OTHER -> Assert(FALSE, "tla-ts can't call Temporal.Duration.prototype." \o method)
       [] OTHER -> Assert(FALSE, "tla-ts can't call Temporal." \o kind \o ".prototype." \o method)
`;
