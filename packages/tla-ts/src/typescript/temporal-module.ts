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

RECURSIVE TemporalHoursInDay(_)

\* What a Temporal prototype's getter gives for a receiver that it reads. A zoned date-time's
\* hoursInDay reads the time zone's transitions only where a script reads it.
TemporalGetterValue(heap, path, receiver) ==
  IF path = "get Temporal.ZonedDateTime.prototype.hoursInDay"
  THEN TemporalHoursInDay(TSlots(heap, receiver))
  ELSE TSlots(heap, receiver).getters[TemporalGetterName(path)]

RECURSIVE TemporalText(_, _, _)

LOCAL TemporalConversionOwner(path) ==
  CHOOSE kind \in {"Duration", "Instant", "PlainDate", "PlainTime", "PlainDateTime", "PlainYearMonth",
                   "PlainMonthDay", "ZonedDateTime"} :
    path \in {"Temporal." \o kind \o ".prototype.toString", "Temporal." \o kind \o ".prototype.valueOf"}

\* Whether ToPrimitive calls a Temporal prototype's toString or valueOf.
IsTemporalConversion(path) ==
  \E kind \in {"Duration", "Instant", "PlainDate", "PlainTime", "PlainDateTime", "PlainYearMonth",
               "PlainMonthDay", "ZonedDateTime"} :
    path \in {"Temporal." \o kind \o ".prototype.toString", "Temporal." \o kind \o ".prototype.valueOf"}

\* What a Temporal prototype's toString gives where ToPrimitive calls it, with no options. valueOf
\* always throws a TypeError, as toString does on another receiver, where tla-ts stops.
TemporalConverted(heap, path, receiver) ==
  LET kind == TemporalConversionOwner(path)
      given == TemporalText(heap, kind, receiver)
  IN CASE path = "Temporal." \o kind \o ".prototype.valueOf" \/ TSlots(heap, receiver).kind # kind ->
            Assert(FALSE, "tla-ts can't throw the TypeError of " \o path \o " where it converts an object")
       [] given.error # "" ->
            Assert(FALSE, "tla-ts can't throw the " \o given.error \o " of " \o path \o " where it converts an object")
       [] OTHER -> given.value
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

\* The label of an argument that a Temporal function converts.
LOCAL TArgumentLabel(position) == "argument " \o ToString(position)

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

\* A Temporal function converts an object through its methods, which a script gives, so it asks for
\* the primitive that ToPrimitive gives with a kind's hint, which the statement that calls it gets
\* and passes back in its heap's answers, keyed by the kind, the label of the property or argument
\* that the object came from, and the object.
LOCAL TPending(kind, label, value) ==
  [error |-> "pending", value |-> Undefined, request |-> [kind |-> kind, label |-> label, value |-> value]]

LOCAL TIsAnswered(heap, kind, label, value) ==
  "answers" \in DOMAIN heap /\ <<kind, label, value>> \in DOMAIN heap.answers

LOCAL TAnswer(heap, kind, label, value) == heap.answers[<<kind, label, value>>]

LOCAL TPrimitiveNumber(value) ==
  IF IsBigInt(value) \/ IsSymbol(value) THEN TFail("TypeError") ELSE TOk(ToNumber(value))

LOCAL TPrimitiveString(value) == IF IsSymbol(value) THEN TFail("TypeError") ELSE TOk(StringOf(value))

\* ToNumber of a value that a Temporal function reads.
LOCAL TToNumber(heap, value, label) ==
  CASE IsRef(value) \/ IsSequenceValue(value) ->
         IF TIsAnswered(heap, "number", label, value)
         THEN TPrimitiveNumber(TAnswer(heap, "number", label, value))
         ELSE TPending("number", label, value)
    [] OTHER -> TPrimitiveNumber(value)

\* ToString of a value that a Temporal function reads.
LOCAL TToString(heap, value, label) ==
  CASE IsRef(value) \/ IsSequenceValue(value) ->
         IF TIsAnswered(heap, "string", label, value)
         THEN TPrimitiveString(TAnswer(heap, "string", label, value))
         ELSE TPending("string", label, value)
    [] OTHER -> TPrimitiveString(value)

\* ToIntegerIfIntegral.
LOCAL TIntegral(heap, value, label) ==
  LET number == TToNumber(heap, value, label)
  IN CASE number.error # "" -> number
       [] ~IsIntegral(number.value) -> TFail("RangeError")
       [] OTHER -> TOk(ToBigInt(number.value))

\* ToIntegerWithTruncation.
LOCAL TTruncated(heap, value, label) ==
  LET number == TToNumber(heap, value, label)
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

\* The first step of steps in order that fails, which a failure passes on whole.
LOCAL TFirstFailed(steps) == Head(SelectSeq(steps, LAMBDA step : step.error # ""))

\* GetOptionsObject, where undefined stands for an object without properties.
LOCAL TOptions(heap, options) ==
  CASE options = Undefined -> TOk(Undefined)
    [] TIsObject(heap, options) -> TOk(options)
    [] OTHER -> TFail("TypeError")

LOCAL TOption(heap, options, key) == IF options = Undefined THEN Undefined ELSE TGet(heap, options, key)

\* GetOption of a string among allowed, of the option's value, or the fallback where it's undefined.
LOCAL TStringOf(heap, value, label, allowed, fallback) ==
  LET text == TToString(heap, value, label)
  IN CASE value = Undefined -> TOk(fallback)
       [] text.error # "" -> text
       [] text.value \notin allowed -> TFail("RangeError")
       [] OTHER -> text

LOCAL TRoundingModes ==
  {"ceil", "floor", "expand", "trunc", "halfCeil", "halfFloor", "halfExpand", "halfTrunc", "halfEven"}

LOCAL TRoundingModeOption(heap, options, fallback) ==
  TStringOf(heap, TOption(heap, options, "roundingMode"), "roundingMode", TRoundingModes, fallback)

\* GetRoundingIncrementOption.
LOCAL TRoundingIncrementOption(heap, options) ==
  LET value == TOption(heap, options, "roundingIncrement")
      integer == TTruncated(heap, value, "roundingIncrement")
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
LOCAL TUnitOf(heap, value, label) ==
  LET allowed == {TUnits[position] : position \in 1..10} \cup {TPluralUnits[position] : position \in 1..10}
                   \cup {"auto"}
      text == TStringOf(heap, value, label, allowed, "unset")
  IN CASE text.error # "" -> text
       [] text.value \in {TPluralUnits[position] : position \in 1..10} ->
            TOk(TUnits[CHOOSE position \in 1..10 : TPluralUnits[position] = text.value])
       [] OTHER -> text

LOCAL TUnitOption(heap, options, key) == TUnitOf(heap, TOption(heap, options, key), key)

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
      text == TToString(heap, value, "fractionalSecondDigits")
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
      converted == [position \in 1..10 |->
                      IF read[position] = Undefined THEN TOk(Undefined)
                      ELSE TIntegral(heap, read[position], TDurationKeys[position])]
      error == TFirstError([position \in 1..10 |-> converted[order[position]]])
  IN CASE ~TIsObject(heap, item) -> TFail("TypeError")
       [] error # "" -> TFirstFailed([position \in 1..10 |-> converted[order[position]]])
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

LOCAL TMaxInstant == BigIntMultiply(TBig(100000000), TNsPerDay)

LOCAL TIsValidEpochNs(ns) == ~TLess(TMaxInstant, TAbs(ns))

\* A time zone: its identifier, its primary identifier, or "" for an offset, and its offset where
\* it's fixed, or the index of its table in TimeZones. No time zone, where epoch nanoseconds are
\* UTC's, has the identifier "".
LOCAL TNoZone == [id |-> "", primary |-> "", offset |-> Big :> 0, index |-> 0]

LOCAL TUTC == [id |-> "UTC", primary |-> "UTC", offset |-> Big :> 0, index |-> 0]

\* The day that the tables of the time zones end on, the start of 2038, past which a table that
\* isn't final doesn't tell a zone's offsets.
LOCAL TZoneEndDay == 24837

\* The second of epoch nanoseconds, rounded down, as its day and its second within the day.
LOCAL TSecondOf(ns) ==
  LET balanced == TBalanceTime(TMidnight, ns)
  IN <<TSmall(balanced.days), balanced.time[1] * 3600 + balanced.time[2] * 60 + balanced.time[3]>>

\* The number of a table's transitions at or before a second, from low to high.
RECURSIVE TTransitionsUpTo(_, _, _, _)
LOCAL TTransitionsUpTo(table, second, low, high) ==
  IF low >= high
  THEN low
  ELSE LET middle == (low + high + 1) \div 2
       IN IF \/ table.days[middle] < second[1]
             \/ table.days[middle] = second[1] /\ table.seconds[middle] <= second[2]
          THEN TTransitionsUpTo(table, second, middle, high)
          ELSE TTransitionsUpTo(table, second, low, middle - 1)

LOCAL TSecondsNs(seconds) == BigIntMultiply(TBig(seconds), TNsPerSecond)

LOCAL TTransitionNs(table, index) ==
  BigIntAdd(BigIntMultiply(TBig(table.days[index]), TNsPerDay), TSecondsNs(table.seconds[index]))

\* The table of a named time zone, which stops at a second whose offset it doesn't tell.
LOCAL TZoneTable(zone, second) ==
  IF ~TimeZones[zone.index].isFinal /\ second[1] >= TZoneEndDay
  THEN Assert(FALSE, "tla-ts can't tell the offsets of the time zone " \o zone.id \o " after 2037")
  ELSE TimeZones[zone.index]

\* GetOffsetNanosecondsFor.
LOCAL TZoneOffset(zone, ns) ==
  IF zone.index = 0
  THEN zone.offset
  ELSE LET second == TSecondOf(ns)
           table == TZoneTable(zone, second)
       IN TSecondsNs(table.offsets[TTransitionsUpTo(table, second, 0, Len(table.days)) + 1])

\* GetNamedTimeZoneNextTransition and GetNamedTimeZonePreviousTransition, or Null for a time zone
\* whose offset is fixed.
LOCAL TNextTransition(zone, ns) ==
  IF zone.index = 0
  THEN Null
  ELSE LET table == TimeZones[zone.index]
           count == TTransitionsUpTo(table, TSecondOf(ns), 0, Len(table.days))
       IN CASE count < Len(table.days) -> TTransitionNs(table, count + 1)
            [] table.isFinal -> Null
            [] OTHER -> Assert(FALSE, "tla-ts can't tell the offsets of the time zone " \o zone.id \o " after 2037")

LOCAL TPreviousTransition(zone, ns) ==
  IF zone.index = 0
  THEN Null
  ELSE LET second == TSecondOf(BigIntSubtract(ns, Big :> 1))
           table == TZoneTable(zone, second)
           count == TTransitionsUpTo(table, second, 0, Len(table.days))
       IN IF count = 0 THEN Null ELSE TTransitionNs(table, count)

\* GetPossibleEpochNanoseconds, earliest first, which throws a RangeError where one is past the
\* limits, as Node does, though not where only the date is. A named time zone's offsets a day before
\* and a day after the date and the time give the candidates, as its transitions are days apart.
LOCAL TPossibleNs(zone, date, time) ==
  LET utc == TEpochNs(date, time)
      before == TZoneOffset(zone, BigIntSubtract(utc, TNsPerDay))
      after == TZoneOffset(zone, BigIntAdd(utc, TNsPerDay))
      isAt(offset) == TZoneOffset(zone, BigIntSubtract(utc, offset)) = offset
      offsets == CASE zone.index = 0 -> <<zone.offset>>
                   [] before = after -> SelectSeq(<<before>>, LAMBDA offset : isAt(offset))
                   [] TLess(after, before) -> SelectSeq(<<before, after>>, LAMBDA offset : isAt(offset))
                   [] OTHER -> SelectSeq(<<after, before>>, LAMBDA offset : isAt(offset))
      possible == [position \in DOMAIN offsets |-> BigIntSubtract(utc, offsets[position])]
  IN CASE \E position \in DOMAIN possible : ~TIsValidEpochNs(possible[position]) -> TFail("RangeError")
       [] OTHER -> TOk(possible)

\* DisambiguatePossibleEpochNanoseconds. Where a gap skips the date and the time, the change of offset
\* across it moves them to a date and a time that the time zone has.
LOCAL TDisambiguate(possible, zone, date, time, disambiguation) ==
  LET count == Len(possible)
      utc == TEpochNs(date, time)
      dayBefore == BigIntSubtract(utc, TNsPerDay)
      dayAfter == BigIntAdd(utc, TNsPerDay)
      shift == BigIntSubtract(TZoneOffset(zone, dayAfter), TZoneOffset(zone, dayBefore))
      shifted == TBalanceTime(time, IF disambiguation = "earlier" THEN BigIntNegate(shift) ELSE shift)
      again == TPossibleNs(zone, TAddDays(date, TSmall(shifted.days)), shifted.time)
  IN CASE count = 1 -> TOk(possible[1])
       [] count > 1 /\ disambiguation \in {"earlier", "compatible"} -> TOk(possible[1])
       [] count > 1 /\ disambiguation = "later" -> TOk(possible[count])
       [] disambiguation = "reject" -> TFail("RangeError")
       [] ~TIsValidEpochNs(dayBefore) \/ ~TIsValidEpochNs(dayAfter) -> TFail("RangeError")
       [] again.error # "" -> again
       [] disambiguation = "earlier" -> TOk(again.value[1])
       [] OTHER -> TOk(again.value[Len(again.value)])

\* GetEpochNanosecondsFor, or GetUTCEpochNanoseconds without a time zone.
LOCAL TZonedNsWith(zone, date, time, disambiguation) ==
  LET possible == TPossibleNs(zone, date, time)
  IN CASE zone.id = "" -> TOk(TEpochNs(date, time))
       [] possible.error # "" -> possible
       [] OTHER -> TDisambiguate(possible.value, zone, date, time, disambiguation)

LOCAL TZonedNs(zone, date, time) == TZonedNsWith(zone, date, time, "compatible")

\* GetStartOfDay: midnight, or where a gap skips midnight, the transition that ends the gap.
LOCAL TStartOfDay(zone, date) ==
  LET possible == TPossibleNs(zone, date, TMidnight)
      dayBefore == BigIntSubtract(TEpochNs(date, TMidnight), TNsPerDay)
  IN CASE possible.error # "" -> possible
       [] possible.value # <<>> -> TOk(possible.value[1])
       [] ~TIsValidEpochNs(dayBefore) -> TFail("RangeError")
       [] OTHER -> TOk(TNextTransition(zone, dayBefore))

\* TimeZoneEquals: the same identifier, or named time zones of the same primary identifier.
LOCAL TZoneEquals(one, two) == one.id = two.id \/ (one.primary # "" /\ one.primary = two.primary)

\* The date and time in UTC of epoch nanoseconds.
LOCAL TDateTimeOfNs(ns) ==
  LET balanced == TBalanceTime(TMidnight, ns)
  IN [date |-> TDateOfDays(TSmall(balanced.days)), time |-> balanced.time]

\* A quotient of two integers whose divisor isn't 0, rounded to the nearest Number.
LOCAL TSignedQuotientNumber(dividend, divisor) ==
  IF TIsNegative(divisor)
  THEN TQuotientNumber(BigIntNegate(dividend), BigIntNegate(divisor))
  ELSE TQuotientNumber(dividend, divisor)

\* PadISOYear.
LOCAL TYearText(year) ==
  IF year >= 0 /\ year <= 9999
  THEN TPadded(ToString(year), 4)
  ELSE (IF year > 0 THEN "+" ELSE "-") \o TPadded(ToString(IF year < 0 THEN -year ELSE year), 6)

LOCAL TTwoDigits(value) == TPadded(ToString(value), 2)

\* FormatDateTimeUTCOffsetRounded.
\* FormatUTCOffsetNanoseconds, of an offset of whole seconds.
LOCAL TOffsetFullText(offset) ==
  LET seconds == TSmall(BigIntDivide(offset, TNsPerSecond))
      magnitude == IF seconds < 0 THEN -seconds ELSE seconds
  IN (IF seconds < 0 THEN "-" ELSE "+") \o TTwoDigits(magnitude \div 3600) \o ":"
       \o TTwoDigits((magnitude \div 60) % 60) \o IF magnitude % 60 = 0 THEN "" ELSE ":" \o TTwoDigits(magnitude % 60)

LOCAL TOffsetText(offset) ==
  LET minutes == TSmall(BigIntDivide(TRoundToIncrement(offset, TNsPerMinute, "halfExpand"), TNsPerMinute))
      magnitude == IF minutes < 0 THEN -minutes ELSE minutes
  IN (IF minutes < 0 THEN "-" ELSE "+") \o TTwoDigits(magnitude \div 60) \o ":" \o TTwoDigits(magnitude % 60)

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

\* The calendars other than the ISO 8601 calendar that Node 26 takes and tla-ts doesn't run, by
\* their ASCII-lowercase forms, aliases included.
LOCAL TOtherCalendars == {"chinese", "dangi"}

\* The calendars that tla-ts runs whose months aren't the ISO 8601 calendar's, each of which counts
\* its days arithmetically, as Node does: the Coptic and the two Ethiopian calendars, of 13 months
\* each, the tabular Islamic calendars, the Indian national calendar, the Persian calendar, and the
\* Hebrew calendar, whose leap years add a month. The Umm al-Qura calendar is the civil Islamic
\* calendar outside the years that Node's table of its months covers.
LOCAL TCopticCalendars == {"coptic", "ethiopic", "ethioaa"}

LOCAL TIslamicCalendars == {"islamic-civil", "islamic-tbla", "islamic-umalqura"}

LOCAL TSimpleCalendars == TCopticCalendars \cup TIslamicCalendars \cup {"indian", "persian", "hebrew"}

\* What a calendar's arithmetic year adds to the ISO year.
LOCAL TYearOffset(calendar) == CASE calendar = "buddhist" -> 543 [] calendar = "roc" -> -1911 [] OTHER -> 0

\* The day of an ISO date counted from day 1 of the proleptic Gregorian calendar.
LOCAL TRataDie(date) == TEpochDays(date) + 719163

LOCAL TDateOfRataDie(day) == TDateOfDays(day - 719163)

\* The day before a Coptic or an Ethiopian year 1 starts, and a year in its Amete Mihret count.
LOCAL TCopticEpoch(calendar) == IF calendar = "coptic" THEN 103604 ELSE 2795

LOCAL TCopticYear(calendar, year) == IF calendar = "ethioaa" THEN year - 5500 ELSE year

\* The day before a tabular Islamic year 1 starts, on its Friday or its Thursday epoch.
LOCAL TIslamicEpoch(calendar) == IF calendar = "islamic-tbla" THEN 227013 ELSE 227014

\* The years 1300 to 1600 of the Umm al-Qura calendar, as Node's table gives them: each year's 30-day
\* months as bits, and the days from the start of 1300, which the civil calendar starts on too, to
\* the start of each year through 1601, where the civil calendar takes over again.
LOCAL TUmalquraMonths ==
  <<
  1365, 683, 2359, 694, 1398, 876, 2901, 2730, 2390, 1182, 2397, 698, 1461, 938, 2891, 2710, 1326,
  685, 1389, 2906, 1874, 3877, 3722, 3350, 2646, 2741, 1716, 3497, 2962, 2853, 1611, 2715, 858,
  1753, 1492, 3493, 3402, 2709, 1334, 2421, 756, 1769, 1748, 1705, 1333, 605, 1213, 2490, 948,
  2921, 2858, 2645, 1197, 2653, 730, 1753, 3754, 3732, 3370, 3158, 1198, 2669, 1386, 3413, 3402,
  2707, 1323, 2651, 1338, 1717, 3753, 3410, 3369, 2645, 1197, 1389, 2794, 1764, 3793, 3490, 2730,
  2394, 730, 1465, 2994, 1892, 1737, 1365, 683, 1243, 2746, 1460, 3497, 3410, 2725, 2349, 621,
  2285, 730, 2773, 2725, 2635, 1175, 2359, 694, 2421, 3433, 3410, 3221, 2347, 603, 1243, 2517,
  1490, 3493, 3402, 2709, 1357, 2733, 938, 3026, 3012, 2953, 2709, 1325, 1453, 2922, 1748, 3529,
  3474, 2726, 2390, 686, 1389, 874, 2901, 2730, 2381, 1181, 2397, 698, 1461, 1450, 3413, 2714,
  2350, 622, 1373, 2778, 1748, 1701, 2855, 2637, 1197, 1389, 2906, 1876, 3913, 3730, 3366, 2646,
  854, 1717, 2986, 2962, 2853, 1675, 2715, 1370, 2778, 1460, 3497, 2898, 2714, 1334, 630, 1397,
  2802, 1748, 1705, 1365, 685, 1213, 2490, 1396, 2921, 2898, 2709, 1325, 2653, 1242, 2777, 1714,
  3733, 3626, 3222, 2350, 2733, 1386, 3429, 3402, 3349, 1579, 3163, 1338, 1717, 3506, 3428, 3369,
  2645, 1197, 2413, 2794, 1768, 3793, 3492, 3402, 2666, 730, 1465, 2930, 2920, 1745, 1621, 1195,
  2395, 698, 1461, 3497, 3410, 3238, 2382, 1134, 2397, 1242, 2773, 2730, 2637, 1179, 2359, 1206,
  2421, 3434, 3410, 2725, 2379, 683, 1371, 2777, 1490, 3525, 3474, 2853, 1365, 2741, 1460, 2985,
  1954, 1861, 1427, 2731, 1238, 2518, 1490, 2981, 2890, 2709, 1197, 349, 733, 2522, 1460, 1449,
  1325, 603, 2231, 374, 1389, 2922, 2762, 2710, 1323, 347, 699, 1462, 3498, 2964, 3398, 2701, 1325,
  2717, 1370, 1877, 1865, 3859, 3658, 2710, 1366, 1717, 2986, 2964
  >>

LOCAL TUmalquraStarts ==
  <<
  0, 354, 708, 1063, 1417, 1772, 2126, 2481, 2835, 3189, 3543, 3898, 4252, 4607, 4961, 5316, 5670,
  6024, 6378, 6733, 7088, 7442, 7797, 8151, 8505, 8859, 9214, 9568, 9923, 10277, 10631, 10985,
  11340, 11694, 12049, 12403, 12758, 13112, 13466, 13820, 14175, 14529, 14884, 15238, 15592, 15946,
  16300, 16655, 17010, 17364, 17719, 18073, 18427, 18781, 19136, 19490, 19845, 20200, 20554, 20908,
  21262, 21616, 21971, 22325, 22680, 23034, 23388, 23742, 24097, 24451, 24806, 25161, 25515, 25869,
  26223, 26577, 26932, 27287, 27641, 27996, 28350, 28704, 29058, 29412, 29767, 30122, 30476, 30830,
  31184, 31538, 31893, 32248, 32602, 32957, 33311, 33665, 34019, 34373, 34728, 35082, 35437, 35791,
  36145, 36499, 36854, 37208, 37563, 37918, 38272, 38626, 38980, 39334, 39689, 40044, 40398, 40753,
  41107, 41461, 41815, 42170, 42524, 42879, 43233, 43587, 43941, 44295, 44650, 45005, 45359, 45714,
  46068, 46422, 46776, 47130, 47485, 47839, 48194, 48548, 48902, 49256, 49611, 49965, 50320, 50674,
  51029, 51383, 51737, 52091, 52446, 52801, 53155, 53509, 53864, 54218, 54572, 54927, 55282, 55636,
  55991, 56345, 56699, 57053, 57407, 57762, 58117, 58471, 58825, 59179, 59534, 59888, 60243, 60597,
  60952, 61306, 61660, 62014, 62368, 62723, 63078, 63432, 63786, 64140, 64494, 64849, 65204, 65558,
  65913, 66267, 66621, 66975, 67330, 67684, 68039, 68393, 68748, 69102, 69456, 69810, 70165, 70519,
  70874, 71228, 71582, 71936, 72291, 72645, 73000, 73355, 73709, 74063, 74417, 74771, 75126, 75481,
  75835, 76190, 76544, 76898, 77252, 77606, 77961, 78316, 78670, 79024, 79378, 79732, 80087, 80441,
  80796, 81151, 81505, 81859, 82213, 82567, 82922, 83276, 83631, 83985, 84339, 84693, 85048, 85402,
  85757, 86112, 86466, 86820, 87174, 87528, 87883, 88238, 88592, 88947, 89301, 89655, 90009, 90364,
  90718, 91073, 91427, 91781, 92135, 92490, 92844, 93199, 93553, 93908, 94262, 94616, 94970, 95324,
  95679, 96034, 96388, 96742, 97096, 97450, 97805, 98159, 98514, 98869, 99223, 99577, 99931,
  100285, 100640, 100995, 101350, 101704, 102058, 102412, 102766, 103121, 103475, 103830, 104184,
  104539, 104893, 105247, 105601, 105956, 106311, 106665
  >>

LOCAL TIsUmalquraTable(calendar, year) == calendar = "islamic-umalqura" /\ year >= 1300 /\ year <= 1600

LOCAL TUmalquraLong(year, month) == (TUmalquraMonths[year - 1299] \div 2 ^ (month - 1)) % 2 = 1

\* The day that an Indian year starts on, in March of its Gregorian year, and the days before a month.
LOCAL TIndianStart(year) == TRataDie(<<year + 78, 3, IF TIsLeapYear(year + 78) THEN 21 ELSE 22>>)

LOCAL TIndianBefore(year, month) ==
  LET first == IF TIsLeapYear(year + 78) THEN 31 ELSE 30
  IN CASE month = 1 -> 0
       [] month <= 7 -> first + 31 * (month - 2)
       [] OTHER -> first + 155 + 30 * (month - 7)

\* The Persian years that the 33-year rule makes leap years but Node's calendar doesn't, which moves
\* each one's leap day to the next year.
LOCAL TPersianCorrections ==
  {1502, 1601, 1634, 1667, 1700, 1733, 1766, 1799, 1832, 1865, 1898, 1931, 1964, 1997, 2030, 2059,
   2063, 2096, 2129, 2158, 2162, 2191, 2195, 2224, 2228, 2257, 2261, 2290, 2294, 2323, 2327, 2356,
   2360, 2389, 2393, 2422, 2426, 2455, 2459, 2488, 2492, 2521, 2525, 2554, 2558, 2587, 2591, 2620,
   2624, 2653, 2657, 2686, 2690, 2719, 2723, 2748, 2752, 2756, 2781, 2785, 2789, 2818, 2822, 2847,
   2851, 2855, 2880, 2884, 2888, 2913, 2917, 2921, 2946, 2950, 2954, 2979, 2983, 2987}

LOCAL TPersianLeap(year) ==
  CASE year \in TPersianCorrections -> FALSE
    [] year - 1 \in TPersianCorrections -> TRUE
    [] OTHER -> (25 * year + 11) % 33 < 8

\* The rata die that a Persian year starts on.
LOCAL TPersianStart(year) ==
  226895 + 365 * (year - 1) + (8 * year + 21) \div 33 - (IF year - 1 \in TPersianCorrections THEN 1 ELSE 0)

\* The Persian year that a rata die is in, from an estimate within a year or two.
RECURSIVE TPersianYearAt(_, _)
LOCAL TPersianYearAt(day, year) ==
  CASE TPersianStart(year) > day -> TPersianYearAt(day, year - 1)
    [] TPersianStart(year + 1) <= day -> TPersianYearAt(day, year + 1)
    [] OTHER -> year

\* The Hebrew months before a year, and the days from its epoch to the year's molad, delayed as the
\* calendar delays it, which splits the parts of an hour that a TLC integer wouldn't hold.
LOCAL THebrewMonthsBefore(year) == (235 * year - 234) \div 19

LOCAL THebrewElapsed(year) ==
  LET months == THebrewMonthsBefore(year)
      days == 29 * months + 13753 * (months \div 25920) + (12084 + 13753 * (months % 25920)) \div 25920
  IN IF (3 * (days + 1)) % 7 < 3 THEN days + 1 ELSE days

\* The rata die that a Hebrew year starts on, which the lengths of its neighbours delay.
LOCAL THebrewNewYear(year) ==
  LET before == THebrewElapsed(year - 1)
      elapsed == THebrewElapsed(year)
      after == THebrewElapsed(year + 1)
  IN -1373427 + elapsed + (CASE after - elapsed = 356 -> 2 [] elapsed - before = 382 -> 1 [] OTHER -> 0)

LOCAL THebrewLength(year) == THebrewNewYear(year + 1) - THebrewNewYear(year)

LOCAL TSimpleLeap(calendar, year) ==
  CASE calendar \in TCopticCalendars -> TCopticYear(calendar, year) % 4 = 3
    [] TIsUmalquraTable(calendar, year) -> TUmalquraStarts[year - 1298] - TUmalquraStarts[year - 1299] = 355
    [] calendar \in TIslamicCalendars -> (14 + 11 * year) % 30 < 11
    [] calendar = "hebrew" -> (7 * year + 1) % 19 < 7
    [] calendar = "persian" -> TPersianLeap(year)
    [] OTHER -> TIsLeapYear(year + 78)

LOCAL TSimpleMonths(calendar, year) ==
  CASE calendar \in TCopticCalendars -> 13
    [] calendar = "hebrew" -> IF TSimpleLeap(calendar, year) THEN 13 ELSE 12
    [] OTHER -> 12

\* The month code of a calendar's month in a year, as a record of the number of the month it
\* follows and whether it's a leap month, and the month that a month code is in a year that has it.
\* A Hebrew leap year inserts Adar I, M05L, before Adar, M06.
LOCAL TSimpleCode(calendar, year, month) ==
  CASE calendar # "hebrew" \/ ~TSimpleLeap(calendar, year) \/ month <= 5 -> [month |-> month, isLeap |-> FALSE]
    [] month = 6 -> [month |-> 5, isLeap |-> TRUE]
    [] OTHER -> [month |-> month - 1, isLeap |-> FALSE]

LOCAL TSimpleOrdinal(calendar, year, code) ==
  CASE calendar # "hebrew" \/ ~TSimpleLeap(calendar, year) \/ (code.month <= 5 /\ ~code.isLeap) -> code.month
    [] code.isLeap -> 6
    [] OTHER -> code.month + 1

\* IsValidMonthCodeForCalendar, and YearContainsMonthCode.
LOCAL TCodeValid(calendar, code) ==
  IF calendar = "hebrew"
  THEN (~code.isLeap /\ code.month <= 12) \/ (code.isLeap /\ code.month = 5)
  ELSE ~code.isLeap /\ code.month <= IF calendar \in TCopticCalendars THEN 13 ELSE 12

LOCAL TYearHasCode(calendar, year, code) == ~code.isLeap \/ TSimpleLeap(calendar, year)

\* The days of a month of a Hebrew year, by its code: Heshvan and Kislev give a year its length.
LOCAL THebrewDays(year, code) ==
  CASE code.isLeap -> 30
    [] code.month = 2 -> IF THebrewLength(year) % 10 = 5 THEN 30 ELSE 29
    [] code.month = 3 -> IF THebrewLength(year) % 10 = 3 THEN 29 ELSE 30
    [] OTHER -> IF code.month % 2 = 1 THEN 30 ELSE 29

LOCAL TSimpleDaysInMonth(calendar, year, month) ==
  CASE calendar \in TCopticCalendars ->
         IF month = 13 THEN (IF TSimpleLeap(calendar, year) THEN 6 ELSE 5) ELSE 30
    [] TIsUmalquraTable(calendar, year) -> IF TUmalquraLong(year, month) THEN 30 ELSE 29
    [] calendar \in TIslamicCalendars ->
         IF month % 2 = 1 \/ (month = 12 /\ TSimpleLeap(calendar, year)) THEN 30 ELSE 29
    [] calendar = "hebrew" -> THebrewDays(year, TSimpleCode(calendar, year, month))
    [] calendar = "persian" ->
         CASE month <= 6 -> 31 [] month <= 11 -> 30 [] OTHER -> IF TSimpleLeap(calendar, year) THEN 30 ELSE 29
    [] month = 1 -> IF TSimpleLeap(calendar, year) THEN 31 ELSE 30
    [] OTHER -> IF month <= 6 THEN 31 ELSE 30

\* The days of a month of a code in the year that's longest.
LOCAL TSimpleMostDays(calendar, code) ==
  CASE calendar \in TCopticCalendars -> IF code.month = 13 THEN 6 ELSE 30
    [] calendar = "islamic-umalqura" -> 30
    [] calendar \in TIslamicCalendars -> IF code.month % 2 = 1 \/ code.month = 12 THEN 30 ELSE 29
    [] calendar = "hebrew" -> IF code.month % 2 = 1 \/ code.isLeap \/ code.month \in {2, 3} THEN 30 ELSE 29
    [] OTHER -> IF code.month <= 6 THEN 31 ELSE 30

\* The days of the months of a Hebrew year before one.
RECURSIVE THebrewBefore(_, _)
LOCAL THebrewBefore(year, month) ==
  IF month = 1 THEN 0 ELSE THebrewBefore(year, month - 1) + TSimpleDaysInMonth("hebrew", year, month - 1)

\* The days of the months of an Umm al-Qura year in Node's table before one.
RECURSIVE TUmalquraBefore(_, _)
LOCAL TUmalquraBefore(year, month) ==
  IF month = 1 THEN 0 ELSE TUmalquraBefore(year, month - 1) + IF TUmalquraLong(year, month - 1) THEN 30 ELSE 29

\* The rata die of a valid date in a calendar.
LOCAL TSimpleRataDie(calendar, year, month, day) ==
  LET coptic == TCopticYear(calendar, year)
  IN CASE calendar \in TCopticCalendars ->
            TCopticEpoch(calendar) + 365 * (coptic - 1) + coptic \div 4 + 30 * (month - 1) + day
       [] TIsUmalquraTable(calendar, year) ->
            687337 + TUmalquraStarts[year - 1299] + TUmalquraBefore(year, month) + day - 1
       [] calendar \in TIslamicCalendars ->
            TIslamicEpoch(calendar) + (year - 1) * 354 + (3 + 11 * year) \div 30 + 29 * (month - 1)
              + month \div 2 + day
       [] calendar = "hebrew" -> THebrewNewYear(year) + THebrewBefore(year, month) + day - 1
       [] calendar = "persian" ->
            TPersianStart(year) + (IF month <= 7 THEN 31 * (month - 1) ELSE 186 + 30 * (month - 7)) + day - 1
       [] OTHER -> TIndianStart(year) + TIndianBefore(year, month) + day - 1

\* The Hebrew year that a rata die is in, from an estimate within a few years.
RECURSIVE THebrewYearAt(_, _)
LOCAL THebrewYearAt(day, year) ==
  CASE THebrewNewYear(year) > day -> THebrewYearAt(day, year - 1)
    [] THebrewNewYear(year + 1) <= day -> THebrewYearAt(day, year + 1)
    [] OTHER -> year

\* The Umm al-Qura year that a rata die is in, from its civil year, which is within a year of it.
RECURSIVE TUmalquraYearAt(_, _)
LOCAL TUmalquraYearAt(day, year) ==
  CASE TSimpleRataDie("islamic-umalqura", year, 1, 1) > day -> TUmalquraYearAt(day, year - 1)
    [] TSimpleRataDie("islamic-umalqura", year + 1, 1, 1) <= day -> TUmalquraYearAt(day, year + 1)
    [] OTHER -> year

\* The month of a calendar's year that a day of the year, counted from 0, is in.
RECURSIVE TSimpleMonthAt(_, _, _, _)
LOCAL TSimpleMonthAt(calendar, year, month, within) ==
  IF within < TSimpleDaysInMonth(calendar, year, month)
  THEN month
  ELSE TSimpleMonthAt(calendar, year, month + 1, within - TSimpleDaysInMonth(calendar, year, month))

\* The year, month, and day in a calendar of a rata die, which splits each product that a TLC
\* integer wouldn't hold.
LOCAL TSimpleDateOf(calendar, day) ==
  LET copticDays == day - TCopticEpoch(calendar) - 1
      coptic == 4 * (copticDays \div 1461) + (4 * (copticDays % 1461) + 1463) \div 1461
      islamicDays == day - TIslamicEpoch(calendar) - 1
      islamic == 30 * (islamicDays \div 10631) + (30 * (islamicDays % 10631) + 10646) \div 10631
      gregorian == TDateOfRataDie(day)[1]
      indian == IF day < TIndianStart(gregorian - 78) THEN gregorian - 79 ELSE gregorian - 78
      year == CASE calendar \in TCopticCalendars -> IF calendar = "ethioaa" THEN coptic + 5500 ELSE coptic
                [] calendar = "islamic-umalqura" -> TUmalquraYearAt(day, islamic)
                [] calendar \in TIslamicCalendars -> islamic
                [] calendar = "hebrew" -> THebrewYearAt(day, ((day + 1373427) * 19) \div 6940 + 1)
                [] calendar = "persian" ->
                     TPersianYearAt(day, 33 * ((day - 226895) \div 12053) + (33 * ((day - 226895) % 12053)) \div 12053 + 1)
                [] OTHER -> indian
      within == day - TSimpleRataDie(calendar, year, 1, 1)
      first == TSimpleDaysInMonth(calendar, year, 1)
      month == CASE calendar \in TCopticCalendars -> within \div 30 + 1
                 [] calendar \in {"hebrew", "persian", "islamic-umalqura"} -> TSimpleMonthAt(calendar, year, 1, within)
                 [] calendar \in TIslamicCalendars -> (11 * within + 330) \div 325
                 [] within < first -> 1
                 [] within < first + 155 -> 2 + (within - first) \div 31
                 [] OTHER -> 7 + (within - first - 155) \div 30
  IN <<year, month, day - TSimpleRataDie(calendar, year, month, 1) + 1>>

\* The months of a calendar before a year, and the year and the month of a count of them.
LOCAL TMonthIndex(calendar, year, month) ==
  IF calendar = "hebrew" THEN THebrewMonthsBefore(year) + month - 1 ELSE year * TSimpleMonths(calendar, 0) + month - 1

RECURSIVE THebrewYearOfIndex(_, _)
LOCAL THebrewYearOfIndex(index, year) ==
  CASE THebrewMonthsBefore(year) > index -> THebrewYearOfIndex(index, year - 1)
    [] THebrewMonthsBefore(year + 1) <= index -> THebrewYearOfIndex(index, year + 1)
    [] OTHER -> year

LOCAL TOfMonthIndex(calendar, index) ==
  LET count == TSimpleMonths(calendar, 0)
      year == THebrewYearOfIndex(index, (19 * index + 234) \div 235)
  IN IF calendar = "hebrew"
     THEN <<year, index - THebrewMonthsBefore(year) + 1>>
     ELSE <<index \div count, (index % count) + 1>>

\* Whether a year of a calendar has a date within the limits.
LOCAL TSimpleYearWithinLimits(calendar, year) ==
  LET months == TSimpleMonths(calendar, year)
  IN /\ TSimpleRataDie(calendar, year, 1, 1) - 719163 <= 100000000
     /\ TSimpleRataDie(calendar, year, months, TSimpleDaysInMonth(calendar, year, months)) - 719163 >= -100000001

\* The reference date of a month code and a day of a calendar: the latest that is in 1972 or before.
RECURSIVE TSimpleReference(_, _, _, _)
LOCAL TSimpleReference(calendar, year, code, day) ==
  LET month == TSimpleOrdinal(calendar, year, code)
  IN IF /\ TYearHasCode(calendar, year, code)
        /\ day <= TSimpleDaysInMonth(calendar, year, month)
        /\ TSimpleRataDie(calendar, year, month, day) <= TRataDie(<<1972, 12, 31>>)
     THEN TDateOfRataDie(TSimpleRataDie(calendar, year, month, day))
     ELSE TSimpleReference(calendar, year - 1, code, day)

\* CalendarISOToDate's year, month, and day of an ISO date in a calendar.
LOCAL TCalendarParts(calendar, date) ==
  IF calendar \in TSimpleCalendars
  THEN TSimpleDateOf(calendar, TRataDie(date))
  ELSE <<date[1] + TYearOffset(calendar), date[2], date[3]>>

\* The month code of the month of an ISO date in a calendar.
LOCAL TCalendarCode(calendar, date) ==
  LET parts == TCalendarParts(calendar, date)
  IN IF calendar \in TSimpleCalendars
     THEN TSimpleCode(calendar, parts[1], parts[2])
     ELSE [month |-> parts[2], isLeap |-> FALSE]

LOCAL TCodeText(code) == "M" \o TTwoDigits(code.month) \o IF code.isLeap THEN "L" ELSE ""

LOCAL TCalendarMonths(calendar, year) == IF calendar \in TSimpleCalendars THEN TSimpleMonths(calendar, year) ELSE 12

\* MonthCodeToOrdinal, of a month code that the year has, as ConstrainMonthCode constrains it.
LOCAL TCodeOrdinal(calendar, year, code) ==
  IF calendar \in TSimpleCalendars
  THEN TSimpleOrdinal(calendar, year, IF TYearHasCode(calendar, year, code) THEN code ELSE [month |-> 6, isLeap |-> FALSE])
  ELSE code.month

\* CalendarDateToISO of an arithmetic year, a BigInt, a month, a day, and the month code that the
\* fields gave, or Undefined, which RegulateISODate runs in the calendars whose months are the ISO
\* 8601 calendar's. A month code that the year lacks is constrained or rejected.
LOCAL TRegulateCalendarDate(calendar, year, month, day, code, overflow) ==
  LET kept == TYearOf(year)
      months == TSimpleMonths(calendar, kept)
      clampedMonth == IF month > months THEN months ELSE month
      days == TSimpleDaysInMonth(calendar, kept, clampedMonth)
  IN CASE calendar \notin TSimpleCalendars ->
            TRegulateDate(TYearOf(BigIntSubtract(year, TBig(TYearOffset(calendar)))), month, day, overflow)
       [] ~TIsYearKept(kept) -> TFail("RangeError")
       [] overflow = "reject" /\ code # Undefined /\ ~TYearHasCode(calendar, kept, code) -> TFail("RangeError")
       [] overflow = "reject" /\ (month > months \/ day > days) -> TFail("RangeError")
       [] OTHER ->
            TOk(TDateOfRataDie(TSimpleRataDie(calendar, kept, clampedMonth, IF day > days THEN days ELSE day)))

\* The calendars with eras that tla-ts runs, whose months and days are the ISO 8601 calendar's: the
\* Gregorian calendar, two whose years count from another year, and the Japanese calendar, whose
\* eras from 1873 start within a year.
LOCAL TEraCalendars == {"gregory", "buddhist", "roc", "japanese"}

\* The Japanese calendar's eras from 1873, with the ISO date each starts on.
LOCAL TJapaneseEras ==
  <<[name |-> "meiji", start |-> <<1873, 1, 1>>, first |-> 1868],
    [name |-> "taisho", start |-> <<1912, 7, 30>>, first |-> 1912],
    [name |-> "showa", start |-> <<1926, 12, 25>>, first |-> 1926],
    [name |-> "heisei", start |-> <<1989, 1, 8>>, first |-> 1989],
    [name |-> "reiwa", start |-> <<2019, 5, 1>>, first |-> 2019]>>

\* CanonicalizeEraInCalendar, or "" where the calendar has no such era.
LOCAL TEraOf(calendar, era) ==
  CASE calendar \in {"coptic", "ethiopic", "hebrew"} /\ era = "am" -> "am"
    [] calendar = "persian" /\ era = "ap" -> "ap"
    [] calendar \in {"ethiopic", "ethioaa"} /\ era = "aa" -> "aa"
    [] calendar = "indian" /\ era = "shaka" -> "shaka"
    [] calendar \in TIslamicCalendars /\ era \in {"ah", "bh"} -> era
    [] calendar \in {"gregory", "japanese"} /\ era \in {"ce", "ad"} -> "ce"
    [] calendar \in {"gregory", "japanese"} /\ era \in {"bce", "bc"} -> "bce"
    [] calendar = "japanese" /\ \E index \in DOMAIN TJapaneseEras : TJapaneseEras[index].name = era -> era
    [] calendar = "buddhist" /\ era = "be" -> "be"
    [] calendar = "roc" /\ era \in {"roc", "broc"} -> era
    [] OTHER -> ""

\* CalendarDateArithmeticYearForEraYear, of BigInts, where an era of the negative kind counts back
\* from the year before its epoch, a Japanese era from 1873 counts from the year it starts in, and
\* the Ethiopian calendar's Amete Alem era counts from 5500 years before its Amete Mihret era.
LOCAL TEraArithmeticYear(calendar, era, eraYear) ==
  LET japanese == SelectSeq(TJapaneseEras, LAMBDA entry : entry.name = era)
  IN CASE era \in {"bce", "broc", "bh"} -> BigIntSubtract(Big :> 1, eraYear)
       [] calendar = "ethiopic" /\ era = "aa" -> BigIntSubtract(eraYear, Big :> 5500)
       [] japanese # <<>> -> BigIntAdd(eraYear, TBig(Head(japanese).first - 1))
       [] OTHER -> eraYear

\* CalendarDateEra and CalendarDateEraYear, of an ISO date and its arithmetic year.
LOCAL TEraOfDate(calendar, date, year) ==
  LET started == SelectSeq(TJapaneseEras, LAMBDA entry : TCompareSequences(date, entry.start) >= 0)
  IN CASE calendar = "buddhist" -> <<"be", year>>
       [] calendar \in {"coptic", "hebrew"} -> <<"am", year>>
       [] calendar = "ethioaa" -> <<"aa", year>>
       [] calendar = "indian" -> <<"shaka", year>>
       [] calendar = "persian" -> <<"ap", year>>
       [] calendar = "ethiopic" -> IF year >= 1 THEN <<"am", year>> ELSE <<"aa", year + 5500>>
       [] calendar \in TIslamicCalendars -> IF year >= 1 THEN <<"ah", year>> ELSE <<"bh", 1 - year>>
       [] calendar = "japanese" /\ started # <<>> ->
            <<started[Len(started)].name, year - started[Len(started)].first + 1>>
       [] year >= 1 -> <<IF calendar = "roc" THEN "roc" ELSE "ce", year>>
       [] OTHER -> <<IF calendar = "roc" THEN "broc" ELSE "bce", 1 - year>>

\* CanonicalizeCalendar, which tla-ts runs for the ISO 8601 calendar and the calendars that it runs,
\* two of which have aliases. Another calendar that Node takes stops, as tla-ts holds none of its
\* data, and one that it doesn't throws a RangeError.
LOCAL TCalendar(text) ==
  CASE TLowercase(text) \in {"iso8601"} \cup TEraCalendars \cup TSimpleCalendars -> TOk(TLowercase(text))
    [] TLowercase(text) = "islamicc" -> TOk("islamic-civil")
    [] TLowercase(text) = "ethiopic-amete-alem" -> TOk("ethioaa")
    [] TLowercase(text) \in TOtherCalendars -> Assert(FALSE, "tla-ts can't use the calendar " \o text)
    [] OTHER -> TFail("RangeError")

\* ---------------------------------------------------------------------------------------------
\* Reading Temporal objects and property bags.

\* Whether a name is Etc/GMT with a sign and digits, which names an available time zone only from
\* Etc/GMT-14 to Etc/GMT+12, without a leading zero, whose offset's sign is the opposite.
LOCAL TIsEtcName(name) ==
  /\ Len(name) >= 9
  /\ TLowercase(SubSeq(name, 1, 7)) = "etc/gmt"
  /\ SubSeq(name, 8, 8) \in {"+", "-"}
  /\ \A position \in 9..Len(name) : TIsDigit(SubSeq(name, position, position))

LOCAL TEtcZone(name) ==
  LET sign == SubSeq(name, 8, 8)
      hours == CHOOSE count \in 0..14 : ToString(count) = SubSeq(name, 9, Len(name))
      id == "Etc/GMT" \o sign \o ToString(hours)
  IN IF \E count \in 0..(IF sign = "-" THEN 14 ELSE 12) : ToString(count) = SubSeq(name, 9, Len(name))
     THEN TOk([id |-> id, primary |-> IF hours = 0 THEN "UTC" ELSE id,
               offset |-> TSecondsNs((IF sign = "-" THEN 3600 ELSE -3600) * hours), index |-> 0])
     ELSE TFail("RangeError")

\* An available time zone identifier: UTC, an offset, an Etc/GMT zone, or a named time zone that
\* TimeZones holds the table of, as the names in the script give them.
LOCAL TZoneOfName(name) ==
  LET offset == TOffsetAt(name, 1, FALSE)
      minutes == TSmall(BigIntDivide(offset.ns, TNsPerMinute))
      magnitude == IF minutes < 0 THEN -minutes ELSE minutes
      tables == {index \in DOMAIN TimeZones : TimeZones[index].key = TLowercase(name)}
      index == CHOOSE table \in tables : TRUE
  IN CASE offset.ok /\ offset.end = Len(name) + 1 ->
            TOk([id |-> (IF minutes < 0 THEN "-" ELSE "+") \o TTwoDigits(magnitude \div 60) \o ":"
                          \o TTwoDigits(magnitude % 60),
                 primary |-> "", offset |-> BigIntMultiply(TBig(minutes), TNsPerMinute), index |-> 0])
       [] TLowercase(name) = "utc" -> TOk(TUTC)
       [] TIsEtcName(name) -> TEtcZone(name)
       [] tables # {} ->
            TOk([id |-> TimeZones[index].id, primary |-> TimeZones[index].primary, offset |-> Big :> 0, index |-> index])
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
  TStringOf(heap, TOption(heap, options, "overflow"), "overflow", {"constrain", "reject"}, "constrain")

\* ToPositiveIntegerWithTruncation.
LOCAL TPositive(heap, value, label) ==
  LET integer == TTruncated(heap, value, label)
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
  <<"day", "era", "eraYear", "hour", "microsecond", "millisecond", "minute", "month", "monthCode",
    "nanosecond", "offset", "second", "timeZone", "year">>

LOCAL TFieldKeySet == {TFieldKeys[index] : index \in DOMAIN TFieldKeys}

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

\* PrepareCalendarFields, of the keys in names and the era and the era year that a calendar with eras
\* adds to a year, as a record of each field's value, or Undefined where it's unset. required is the
\* set of keys that must be there, or any one must where isPartial.
LOCAL TPrepareFields(heap, item, calendar, names, required, isPartial) ==
  LET extra == IF "year" \in names /\ calendar # "iso8601" THEN {"era", "eraYear"} ELSE {}
      keys == SelectSeq(TFieldKeys, LAMBDA key : key \in names \cup extra)
      read == [index \in DOMAIN keys |-> TGet(heap, item, keys[index])]
      converted ==
        [index \in DOMAIN keys |->
           LET key == keys[index]
               value == read[index]
           IN CASE value = Undefined ->
                     IF ~isPartial /\ key \in required THEN TFail("TypeError") ELSE TOk(Undefined)
                [] key \in {"month", "day"} -> TPositive(heap, value, key)
                [] key = "monthCode" -> TMonthCodeOf(value)
                [] key = "era" -> TToString(heap, value, key)
                [] key = "offset" -> TOffsetString(value)
                [] key = "timeZone" -> TTimeZone(heap, value)
                [] OTHER -> TTruncated(heap, value, key)]
      error == TFirstError(converted)
      valueOf(key) ==
        IF \E index \in DOMAIN keys : keys[index] = key
        THEN converted[CHOOSE index \in DOMAIN keys : keys[index] = key].value
        ELSE Undefined
      defaulted(key) == IF ~isPartial /\ key \in TTimeKeys /\ valueOf(key) = Undefined THEN Big :> 0 ELSE valueOf(key)
  IN CASE error # "" -> TFirstFailed(converted)
       [] isPartial /\ \A index \in DOMAIN keys : read[index] = Undefined -> TFail("TypeError")
       [] OTHER -> TOk([key \in TFieldKeySet |-> defaulted(key)])

\* ISODateToFields of a date in a calendar: its year, month code, and day, with a time's fields where
\* hasTime. It leaves out the month, whose number gives another month code in another Hebrew year.
LOCAL TDateFields(date, time, hasTime, calendar) ==
  LET parts == TCalendarParts(calendar, date)
  IN [key \in TFieldKeySet |->
     CASE key = "year" -> TBig(parts[1])
       [] key = "monthCode" -> TCalendarCode(calendar, date)
       [] key = "day" -> TBig(parts[3])
       [] ~hasTime \/ key \in {"month", "era", "eraYear", "offset", "timeZone"} -> Undefined
       [] key = "hour" -> TBig(time[1])
       [] key = "minute" -> TBig(time[2])
       [] key = "second" -> TBig(time[3])
       [] key = "millisecond" -> TBig(time[4])
       [] key = "microsecond" -> TBig(time[5])
       [] OTHER -> TBig(time[6])]

\* CalendarMergeFields, where month and monthCode replace each other, and so do a year and an era
\* with its era year, which only a calendar with eras reads.
LOCAL TMergeFields(fields, additional) ==
  LET isMonthGiven == additional["month"] # Undefined \/ additional["monthCode"] # Undefined
      isYearGiven == \E key \in {"era", "eraYear", "year"} : additional[key] # Undefined
  IN [key \in DOMAIN fields |->
        CASE additional[key] # Undefined -> additional[key]
          [] key \in {"month", "monthCode"} /\ isMonthGiven -> Undefined
          [] key \in {"era", "eraYear", "year"} /\ isYearGiven -> Undefined
          [] OTHER -> fields[key]]

\* CalendarResolveFields, of a type: "date", "year-month", or "month-day", as the arithmetic year that
\* the fields give, a BigInt or Undefined, and the month. A calendar with eras runs NonISOResolveFields,
\* which reads the era and the era year.
LOCAL TResolveFields(fields, type, calendar) ==
  LET code == fields["monthCode"]
      era == fields["era"]
      eraYear == fields["eraYear"]
      year == fields["year"]
      canonical == IF era = Undefined THEN "" ELSE TEraOf(calendar, era)
      arithmetic == IF eraYear = Undefined THEN year ELSE TEraArithmeticYear(calendar, canonical, eraYear)
      resolved(month) == TOk([year |-> arithmetic, month |-> month, code |-> code])
      ordinal == IF arithmetic = Undefined THEN code.month ELSE TCodeOrdinal(calendar, TYearOf(arithmetic), code)
      needsYear ==
        type \in {"date", "year-month"} \/ code = Undefined \/ fields["month"] # Undefined
      isMonthWrong ==
        fields["month"] # Undefined /\ code # Undefined /\ TFieldOf(fields["month"]) # ordinal
  IN IF calendar = "iso8601"
     THEN CASE type \in {"date", "year-month"} /\ year = Undefined -> TFail("TypeError")
            [] type \in {"date", "month-day"} /\ fields["day"] = Undefined -> TFail("TypeError")
            [] fields["month"] = Undefined /\ code = Undefined -> TFail("TypeError")
            [] code = Undefined -> resolved(TFieldOf(fields["month"]))
            [] code.isLeap \/ code.month > 12 -> TFail("RangeError")
            [] isMonthWrong -> TFail("RangeError")
            [] OTHER -> resolved(code.month)
     ELSE CASE needsYear /\ year = Undefined /\ (era = Undefined \/ eraYear = Undefined) ->
                 TFail("TypeError")
            [] era # Undefined /\ eraYear = Undefined -> TFail("TypeError")
            [] eraYear # Undefined /\ era = Undefined -> TFail("TypeError")
            [] type \in {"date", "month-day"} /\ fields["day"] = Undefined -> TFail("TypeError")
            [] fields["month"] = Undefined /\ code = Undefined -> TFail("TypeError")
            [] eraYear # Undefined /\ canonical = "" -> TFail("RangeError")
            [] eraYear # Undefined /\ year # Undefined /\ TCompare(year, arithmetic) # 0 ->
                 TFail("RangeError")
            [] code # Undefined /\ ~TCodeValid(calendar, code) -> TFail("RangeError")
            [] arithmetic # Undefined /\ isMonthWrong -> TFail("RangeError")
            [] code = Undefined -> resolved(TFieldOf(fields["month"]))
            [] OTHER -> resolved(ordinal)

\* CalendarDateFromFields.
LOCAL TDateFromFields(fields, overflow, calendar) ==
  LET month == TResolveFields(fields, "date", calendar)
      date == TRegulateCalendarDate(calendar, month.value.year, month.value.month, TFieldOf(fields["day"]),
                                    month.value.code, overflow)
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
      fields == TPrepareFields(heap, item, "iso8601", TTimeKeys, {}, FALSE)
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
      fields == TPrepareFields(heap, item, calendar.value, {"year", "month", "monthCode", "day"}, {}, FALSE)
      made == TDateFromFields(fields.value, overflow.value, calendar.value)
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

\* ToTemporalDateTime, as the date, the time, and the calendar.
LOCAL TToDateTime(heap, item, options) ==
  LET slots == TSlots(heap, item)
      resolved == TOptions(heap, options)
      overflow == TOverflowOption(heap, resolved.value)
      checked(date, time, calendar) ==
        CASE resolved.error # "" -> resolved
          [] overflow.error # "" -> overflow
          [] ~TDateTimeWithinLimits(date, time) -> TFail("RangeError")
          [] OTHER -> TOk([date |-> date, time |-> time, calendar |-> calendar])
      calendar == TCalendarOfBag(heap, item)
      fields == TPrepareFields(heap, item, calendar.value, TDateTimeKeys, {}, FALSE)
      madeDate == TDateFromFields(fields.value, overflow.value, calendar.value)
      madeTime == TRegulateTime(TTimeOfFields(fields.value), overflow.value)
      parsed == TParseISO(item, "DateTime")
      parsedCalendar == IF parsed.value.calendar = "" THEN TOk("iso8601") ELSE TCalendar(parsed.value.calendar)
  IN CASE slots.kind \in {"PlainDateTime", "ZonedDateTime"} -> checked(slots.date, slots.time, slots.calendar)
       [] slots.kind = "PlainDate" -> checked(slots.date, TMidnight, slots.calendar)
       [] TIsObject(heap, item) ->
            CASE calendar.error # "" -> calendar
              [] fields.error # "" -> fields
              [] resolved.error # "" -> resolved
              [] overflow.error # "" -> overflow
              [] madeDate.error # "" -> madeDate
              [] madeTime.error # "" -> madeTime
              [] ~TDateTimeWithinLimits(madeDate.value, madeTime.value) -> TFail("RangeError")
              [] OTHER -> TOk([date |-> madeDate.value, time |-> madeTime.value, calendar |-> calendar.value])
       [] TypeOf(item) # "string" -> TFail("TypeError")
       [] parsed.error # "" -> parsed
       [] parsedCalendar.error # "" -> parsedCalendar
       [] OTHER ->
            checked(parsed.value.date, parsed.value.time,
                    parsedCalendar.value)

\* GetTemporalShowCalendarNameOption.
LOCAL TCalendarNameOption(heap, options) ==
  TStringOf(heap, TOption(heap, options, "calendarName"), "calendarName", {"auto", "always", "never", "critical"}, "auto")

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
LOCAL TISODateAdd(date, duration, overflow) ==
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
LOCAL TISODateUntil(one, two, largestUnit) ==
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

\* NonISODateAdd of a calendar whose months have their own lengths, with BigInt duration fields.
LOCAL TSimpleDateAdd(calendar, date, duration, overflow) ==
  LET parts == TCalendarParts(calendar, date)
      code == TSimpleCode(calendar, parts[1], parts[2])
      year == TYearOf(BigIntAdd(TBig(parts[1]), duration[1]))
      index == BigIntAdd(TBig(TMonthIndex(calendar, year, TCodeOrdinal(calendar, year, code))), duration[2])
      month == TOfMonthIndex(calendar, TSmall(index))
      days == TSimpleDaysInMonth(calendar, month[1], month[2])
      start == TSimpleRataDie(calendar, month[1], month[2], IF parts[3] > days THEN days ELSE parts[3]) - 719163
      total == BigIntAdd(TBig(start), BigIntAdd(duration[4], BigIntMultiply(duration[3], Big :> 7)))
  IN CASE ~TIsYearKept(year) -> TFail("RangeError")
       [] overflow = "reject" /\ ~TYearHasCode(calendar, year, code) -> TFail("RangeError")
       [] TLess(index, TBig(-20000000)) \/ TLess(TBig(20000000), index) -> TFail("RangeError")
       [] ~TIsYearKept(month[1]) -> TFail("RangeError")
       [] overflow = "reject" /\ parts[3] > days -> TFail("RangeError")
       [] TLess(total, TBig(-100000001)) \/ TLess(TBig(100000000), total) -> TFail("RangeError")
       [] ~TDateWithinLimits(TDateOfDays(TSmall(total))) -> TFail("RangeError")
       [] OTHER -> TOk(TDateOfDays(TSmall(total)))

\* NonISODateUntil of a calendar whose months have their own lengths: the most years and then months
\* that don't pass the later date, as NonISODateSurpasses finds them from a guess that's within one
\* of them, and the days left.
LOCAL TSimpleDateUntil(calendar, one, two, largestUnit) ==
  LET sign == -TCompareSequences(one, two)
      first == TCalendarParts(calendar, one)
      second == TCalendarParts(calendar, two)
      code == TSimpleCode(calendar, first[1], first[2])
      key(month) == month.month * 2 + (IF month.isLeap THEN 1 ELSE 0)
      target == <<second[1], key(TSimpleCode(calendar, second[1], second[2])), second[3]>>
      reached(years, months) ==
        LET year == first[1] + years
        IN TOfMonthIndex(calendar, TMonthIndex(calendar, year, TCodeOrdinal(calendar, year, code)) + months)
      surpasses(years, months) ==
        \/ sign * TCompareSequences(<<first[1] + years, key(code), first[3]>>, target) > 0
        \/ LET at == reached(years, months)
           IN sign * TCompareSequences(<<at[1], at[2], first[3]>>, second) > 0
      guess(count) == IF sign * count < 0 THEN 0 ELSE count
      RECURSIVE BackYears(_), ForeYears(_), BackMonths(_, _), ForeMonths(_, _)
      BackYears(count) == IF count = 0 \/ ~surpasses(count, 0) THEN count ELSE BackYears(count - sign)
      ForeYears(count) == IF surpasses(count + sign, 0) THEN count ELSE ForeYears(count + sign)
      BackMonths(years, count) ==
        IF count = 0 \/ ~surpasses(years, count) THEN count ELSE BackMonths(years, count - sign)
      ForeMonths(years, count) ==
        IF surpasses(years, count + sign) THEN count ELSE ForeMonths(years, count + sign)
      years == IF largestUnit = "year" THEN ForeYears(BackYears(guess(second[1] - first[1]))) ELSE 0
      start == reached(years, 0)
      months == IF largestUnit \in {"year", "month"}
                THEN ForeMonths(years, BackMonths(years, guess(TMonthIndex(calendar, second[1], second[2])
                                                          - TMonthIndex(calendar, start[1], start[2]))))
                ELSE 0
      at == reached(years, months)
      length == TSimpleDaysInMonth(calendar, at[1], at[2])
      days == TRataDie(two) - TSimpleRataDie(calendar, at[1], at[2], IF first[3] > length THEN length ELSE first[3])
      weeks == IF largestUnit = "week" THEN (IF days < 0 THEN -((-days) \div 7) ELSE days \div 7) ELSE 0
  IN IF sign = 0
     THEN <<Big :> 0, Big :> 0, Big :> 0, Big :> 0>>
     ELSE <<TBig(years), TBig(months), TBig(weeks), TBig(days - weeks * 7)>>

\* CalendarDateAdd, of a duration's date fields, as the ISO 8601 calendar adds them in a calendar
\* whose months are its months.
LOCAL TDateAdd(calendar, date, duration, overflow) ==
  IF calendar \in TSimpleCalendars
  THEN TSimpleDateAdd(calendar, date, duration, overflow)
  ELSE TISODateAdd(date, duration, overflow)

\* CalendarDateUntil, as a duration's date fields.
LOCAL TDateUntil(calendar, one, two, largestUnit) ==
  IF calendar \in TSimpleCalendars
  THEN TSimpleDateUntil(calendar, one, two, largestUnit)
  ELSE TISODateUntil(one, two, largestUnit)

\* CreateDateDurationRecord's validity check.
LOCAL TDateDurationValid(date) ==
  TIsValidDuration(<<date[1], date[2], date[3], date[4], Big :> 0, Big :> 0, Big :> 0, Big :> 0, Big :> 0, Big :> 0>>)

\* The epoch nanoseconds that a date duration added to a date and time gives, constrained.
LOCAL TEndNs(calendar, dateTime, duration, zone) ==
  LET added == TDateAdd(calendar, dateTime.date, duration, "constrain")
  IN IF added.error # "" THEN added ELSE TZonedNs(zone, added.value, dateTime.time)

\* ComputeNudgeWindow.
LOCAL TNudgeWindow(calendar, sign, date, originNs, dateTime, zone, increment, unit, isShifted) ==
  LET truncated(value) == TRoundToIncrement(value, increment, "trunc")
      step == BigIntMultiply(increment, TBig(sign))
      weeksStart == TDateAdd(calendar, dateTime.date, <<date[1], date[2], Big :> 0, Big :> 0>>, "constrain")
      weeksUntil == TDateUntil(calendar, weeksStart.value, TAddDays(weeksStart.value, TSmall(date[4])), "week")
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
      start == IF TIsZero(r1) THEN TOk(originNs) ELSE TEndNs(calendar, dateTime, durationOf(r1), zone)
      end == TEndNs(calendar, dateTime, durationOf(r2), zone)
  IN CASE unit = "week" /\ weeksStart.error # "" -> weeksStart
       [] ~TDateDurationValid(durationOf(r1)) \/ ~TDateDurationValid(durationOf(r2)) -> TFail("RangeError")
       [] start.error # "" -> start
       [] end.error # "" -> end
       [] OTHER -> TOk([r1 |-> r1, r2 |-> r2, start |-> start.value, end |-> end.value,
                        startDuration |-> durationOf(r1), endDuration |-> durationOf(r2)])

\* NudgeToCalendarUnit, as the nudged duration's date fields, its epoch nanoseconds, whether it
\* expanded, and the total as a numerator and a denominator.
LOCAL TNudgeToCalendarUnit(calendar, sign, date, originNs, destNs, dateTime, zone, increment, unit, mode) ==
  LET first == TNudgeWindow(calendar, sign, date, originNs, dateTime, zone, increment, unit, FALSE)
      isInside(window) ==
        IF sign = 1
        THEN ~TLess(destNs, window.start) /\ ~TLess(window.end, destNs)
        ELSE ~TLess(destNs, window.end) /\ ~TLess(window.start, destNs)
      second == TNudgeWindow(calendar, sign, date, originNs, dateTime, zone, increment, unit, TRUE)
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

\* BubbleRelativeDuration, of a duration's date fields and time, from the unit at index up to
\* largestUnit.
RECURSIVE TemporalBubble(_, _, _, _, _, _, _, _)
TemporalBubble(calendar, sign, duration, nudgedNs, dateTime, zone, largestUnit, index) ==
  LET unit == TUnits[index]
      date == duration.date
      step == TBig(sign)
      end == CASE unit = "year" -> <<BigIntAdd(date[1], step), Big :> 0, Big :> 0, Big :> 0>>
               [] unit = "month" -> <<date[1], BigIntAdd(date[2], step), Big :> 0, Big :> 0>>
               [] OTHER -> <<date[1], date[2], BigIntAdd(date[3], step), Big :> 0>>
      endNs == TEndNs(calendar, dateTime, end, zone)
  IN CASE index < TUnitIndex(largestUnit) -> TOk(duration)
       [] unit = "week" /\ largestUnit # "week" ->
            TemporalBubble(calendar, sign, duration, nudgedNs, dateTime, zone, largestUnit, index - 1)
       [] ~TDateDurationValid(end) -> TFail("RangeError")
       [] endNs.error # "" -> endNs
       [] TSign(BigIntSubtract(nudgedNs, endNs.value)) # -sign ->
            TemporalBubble(calendar, sign, [date |-> end, time |-> Big :> 0], nudgedNs, dateTime, zone, largestUnit, index - 1)
       [] OTHER -> TOk(duration)

\* NudgeToZonedTime of a fixed-offset time zone.
LOCAL TNudgeToZonedTime(calendar, sign, date, time, dateTime, zone, increment, unit, mode) ==
  LET start == TDateAdd(calendar, dateTime.date, date, "constrain")
      startNs == TZonedNs(zone, start.value, dateTime.time)
      endNs == TZonedNs(zone, TAddDays(start.value, sign), dateTime.time)
      length == BigIntMultiply(increment, TUnitLength(unit))
      rounded == TRoundToIncrement(time, length, mode)
      beyond == BigIntSubtract(rounded, BigIntSubtract(endNs.value, startNs.value))
      isBeyond == TSign(beyond) # -sign
      roundedBeyond == TRoundToIncrement(beyond, length, mode)
  IN CASE start.error # "" -> start
       [] startNs.error # "" -> startNs
       [] endNs.error # "" -> endNs
       [] TLess(TMaxTimeDuration, TAbs(rounded)) -> TFail("RangeError")
       [] isBeyond /\ TLess(TMaxTimeDuration, TAbs(roundedBeyond)) -> TFail("RangeError")
       [] OTHER ->
            TOk([duration |-> <<date[1], date[2], date[3], IF isBeyond THEN BigIntAdd(date[4], TBig(sign)) ELSE date[4]>>,
                 time |-> IF isBeyond THEN roundedBeyond ELSE rounded,
                 nudged |-> IF isBeyond THEN BigIntAdd(endNs.value, roundedBeyond) ELSE BigIntAdd(startNs.value, rounded),
                 isExpanded |-> isBeyond])

\* RoundRelativeDuration, as the duration's date fields and time, of a fixed-offset time zone or
\* TNoZone.
LOCAL TRoundRelative(calendar, date, time, originNs, destNs, dateTime, zone, largestUnit, increment, smallestUnit, mode) ==
  LET sign == IF TDurationSign(<<date[1], date[2], date[3], date[4], time>>) < 0 THEN -1 ELSE 1
      nudge == CASE TIsCalendarUnit(smallestUnit) \/ (zone.id # "" /\ smallestUnit = "day") ->
                      TNudgeToCalendarUnit(calendar, sign, date, originNs, destNs, dateTime, zone, increment, smallestUnit, mode)
                 [] zone.id # "" -> TNudgeToZonedTime(calendar, sign, date, time, dateTime, zone, increment, smallestUnit, mode)
                 [] OTHER -> TNudgeToDayOrTime(date, time, destNs, largestUnit, increment, smallestUnit, mode)
      startUnit == TLargerUnit(smallestUnit, "day")
      nudged == [date |-> nudge.value.duration, time |-> nudge.value.time]
  IN CASE nudge.error # "" -> nudge
       [] nudge.value.isExpanded /\ smallestUnit # "week" /\ startUnit # largestUnit ->
            TemporalBubble(calendar, sign, nudged, nudge.value.nudged, dateTime, zone, largestUnit, TUnitIndex(startUnit) - 1)
       [] OTHER -> TOk(nudged)

\* DifferenceISODateTime, as a duration's date fields and time.
LOCAL TDifferenceDateTime(calendar, date1, time1, date2, time2, largestUnit) ==
  LET timeDifference == BigIntSubtract(TTimeNs(time2), TTimeNs(time1))
      timeSign == TSign(timeDifference)
      dateSign == TCompareSequences(date1, date2)
      isAdjusted == timeSign = dateSign
      adjusted == IF isAdjusted THEN TAddDays(date2, timeSign) ELSE date2
      time == IF isAdjusted
              THEN BigIntSubtract(timeDifference, BigIntMultiply(TBig(timeSign), TNsPerDay))
              ELSE timeDifference
      dateLargestUnit == TLargerUnit("day", largestUnit)
      dates == TDateUntil(calendar, date1, adjusted, dateLargestUnit)
  IN IF largestUnit # dateLargestUnit
     THEN [date |-> <<dates[1], dates[2], dates[3], Big :> 0>>,
           time |-> BigIntAdd(time, BigIntMultiply(dates[4], TNsPerDay))]
     ELSE [date |-> dates, time |-> time]

\* DifferencePlainDateTimeWithRounding, as a duration's date fields and time.
LOCAL TDifferenceRounded(calendar, date1, time1, date2, time2, settings) ==
  LET difference == TDifferenceDateTime(calendar, date1, time1, date2, time2, settings.largest)
  IN CASE TCompareSequences(date1 \o time1, date2 \o time2) = 0 ->
            TOk([date |-> <<Big :> 0, Big :> 0, Big :> 0, Big :> 0>>, time |-> Big :> 0])
       [] ~TDateTimeWithinLimits(date1, time1) \/ ~TDateTimeWithinLimits(date2, time2) -> TFail("RangeError")
       [] settings.smallest = "nanosecond" /\ settings.increment = Big :> 1 -> TOk(difference)
       [] OTHER ->
            TRoundRelative(calendar, difference.date, difference.time, TEpochNs(date1, time1), TEpochNs(date2, time2),
                           [date |-> date1, time |-> time1], TNoZone, settings.largest, settings.increment,
                           settings.smallest, settings.mode)

\* The duration that a difference gives, negated for since.
LOCAL TDifferenceDuration(difference, largestUnit, isSince) ==
  LET made == TDurationFromInternal(difference.value.date, difference.value.time, largestUnit)
  IN CASE difference.error # "" -> difference
       [] made.error # "" -> made
       [] isSince -> TOk(TNegatedDuration(made.value))
       [] OTHER -> made

\* ---------------------------------------------------------------------------------------------
\* Zoned date-times, as their epoch nanoseconds, the time zone, and the calendar.

\* GetISODateTimeFor.
LOCAL TLocal(zone, ns) == TDateTimeOfNs(BigIntAdd(ns, TZoneOffset(zone, ns)))

LOCAL TDisambiguationOption(heap, options) ==
  TStringOf(heap, TOption(heap, options, "disambiguation"), "disambiguation", {"compatible", "earlier", "later", "reject"}, "compatible")

LOCAL TOffsetOption(heap, options, fallback) ==
  TStringOf(heap, TOption(heap, options, "offset"), "offset", {"prefer", "use", "ignore", "reject"}, fallback)

\* ParseTimeZoneIdentifier, as an available time zone identifier.
LOCAL TTimeZoneIdentifier(text) == IF TIsZoneIdentifier(text) THEN TZoneOfName(text) ELSE TFail("RangeError")

\* InterpretISODateTimeOffset, of a behaviour: "wall", "exact", or "option".
LOCAL TInterpretOffset(date, time, hasTime, behaviour, offset, zone, disambiguation, offsetOption, isMatchMinutes) ==
  LET utc == TEpochNs(date, time)
      exact == BigIntSubtract(utc, offset)
      possible == TPossibleNs(zone, date, time)
      isMatched(candidate) ==
        \/ BigIntSubtract(utc, candidate) = offset
        \/ isMatchMinutes /\ TRoundToIncrement(BigIntSubtract(utc, candidate), TNsPerMinute, "halfExpand") = offset
      matched == SelectSeq(possible.value, LAMBDA candidate : isMatched(candidate))
  IN CASE ~hasTime -> TStartOfDay(zone, date)
       [] behaviour = "wall" \/ (behaviour = "option" /\ offsetOption = "ignore") ->
            TZonedNsWith(zone, date, time, disambiguation)
       [] behaviour = "exact" \/ (behaviour = "option" /\ offsetOption = "use") ->
            IF TIsValidEpochNs(exact) THEN TOk(exact) ELSE TFail("RangeError")
       [] TEpochDays(date) < -100000000 \/ TEpochDays(date) > 100000000 -> TFail("RangeError")
       [] possible.error # "" -> possible
       [] matched # <<>> -> TOk(matched[1])
       [] offsetOption = "reject" -> TFail("RangeError")
       [] OTHER -> TDisambiguate(possible.value, zone, date, time, disambiguation)

\* ToTemporalZonedDateTime, as the epoch nanoseconds, the time zone, and the calendar.
LOCAL TToZoned(heap, item, options) ==
  LET slots == TSlots(heap, item)
      resolved == TOptions(heap, options)
      disambiguation == TDisambiguationOption(heap, resolved.value)
      offsetOption == TOffsetOption(heap, resolved.value, "reject")
      overflow == TOverflowOption(heap, resolved.value)
      optionsError == TFirstError(<<resolved, disambiguation, offsetOption, overflow>>)
      calendar == TCalendarOfBag(heap, item)
      fields == TPrepareFields(heap, item, calendar.value, TDateTimeKeys \cup {"offset", "timeZone"},
                               {"timeZone"}, FALSE)
      date == TDateFromFields(fields.value, overflow.value, calendar.value)
      time == TRegulateTime(TTimeOfFields(fields.value), overflow.value)
      bagNs == TInterpretOffset(date.value, time.value, TRUE,
                                IF fields.value["offset"] = Undefined THEN "wall" ELSE "option",
                                IF fields.value["offset"] = Undefined THEN Big :> 0 ELSE fields.value["offset"],
                                fields.value["timeZone"], disambiguation.value, offsetOption.value, FALSE)
      parsed == TParseISO(item, "ZonedDateTime")
      zone == TZoneOfName(parsed.value.zone)
      parsedCalendar == IF parsed.value.calendar = "" THEN TOk("iso8601") ELSE TCalendar(parsed.value.calendar)
      offsetParse == TOffsetAt(parsed.value.offset, 1, TRUE)
      parsedNs == TInterpretOffset(parsed.value.date, parsed.value.time, parsed.value.hasTime,
                                   CASE parsed.value.z -> "exact" [] parsed.value.offset = "" -> "wall" [] OTHER -> "option",
                                   IF parsed.value.offset = "" THEN Big :> 0 ELSE offsetParse.ns,
                                   zone.value, disambiguation.value, offsetOption.value, ~offsetParse.hasSecond)
      made(ns, timeZone, cal) == TOk([ns |-> ns, zone |-> timeZone, calendar |-> cal])
  IN CASE slots.kind = "ZonedDateTime" ->
            IF optionsError # "" THEN TFirstFailed(<<resolved, disambiguation, offsetOption, overflow>>) ELSE made(slots.ns, slots.zone, slots.calendar)
       [] TIsObject(heap, item) ->
            CASE calendar.error # "" -> calendar
              [] fields.error # "" -> fields
              [] optionsError # "" -> TFirstFailed(<<resolved, disambiguation, offsetOption, overflow>>)
              [] date.error # "" -> date
              [] time.error # "" -> time
              [] bagNs.error # "" -> bagNs
              [] OTHER -> made(bagNs.value, fields.value["timeZone"], calendar.value)
       [] TypeOf(item) # "string" -> TFail("TypeError")
       [] parsed.error # "" -> parsed
       [] zone.error # "" -> zone
       [] parsedCalendar.error # "" -> parsedCalendar
       [] resolved.error # "" -> resolved
       [] disambiguation.error # "" -> disambiguation
       [] offsetOption.error # "" -> offsetOption
       [] overflow.error # "" -> overflow
       [] parsedNs.error # "" -> parsedNs
       [] OTHER -> made(parsedNs.value, zone.value, parsedCalendar.value)

\* AddZonedDateTime, of a duration's date fields and time.
LOCAL TZonedAdd(calendar, ns, zone, date, time, overflow) ==
  LET local == TLocal(zone, ns)
      added == TDateAdd(calendar, local.date, date, overflow)
      intermediate == TZonedNs(zone, added.value, local.time)
      result == BigIntAdd(intermediate.value, time)
      instant == BigIntAdd(ns, time)
  IN CASE TIsZero(date[1]) /\ TIsZero(date[2]) /\ TIsZero(date[3]) /\ TIsZero(date[4]) ->
            IF TIsValidEpochNs(instant) THEN TOk(instant) ELSE TFail("RangeError")
       [] added.error # "" -> added
       [] ~TDateTimeWithinLimits(added.value, local.time) -> TFail("RangeError")
       [] intermediate.error # "" -> intermediate
       [] ~TIsValidEpochNs(result) -> TFail("RangeError")
       [] OTHER -> TOk(result)

\* DifferenceZonedDateTime, as a duration's date fields and time.
LOCAL TZonedDifference(calendar, ns1, ns2, zone, largestUnit) ==
  LET start == TLocal(zone, ns1)
      end == TLocal(zone, ns2)
      sign == IF TIsNegative(BigIntSubtract(ns2, ns1)) THEN 1 ELSE -1
      maxCorrection == IF sign = -1 THEN 2 ELSE 1
      first == IF TSign(BigIntSubtract(TTimeNs(end.time), TTimeNs(start.time))) = sign THEN 1 ELSE 0
      RECURSIVE Correct(_)
      Correct(correction) ==
        LET intermediateDate == TAddDays(end.date, correction * sign)
            intermediateNs == TZonedNs(zone, intermediateDate, start.time)
            time == BigIntSubtract(ns2, intermediateNs.value)
        IN CASE intermediateNs.error # "" -> intermediateNs
             [] TSign(time) # sign \/ correction >= maxCorrection -> TOk([date |-> intermediateDate, time |-> time])
             [] OTHER -> Correct(correction + 1)
      corrected == Correct(first)
  IN CASE ns1 = ns2 -> TOk([date |-> <<Big :> 0, Big :> 0, Big :> 0, Big :> 0>>, time |-> Big :> 0])
       [] TCompareSequences(start.date, end.date) = 0 ->
            TOk([date |-> <<Big :> 0, Big :> 0, Big :> 0, Big :> 0>>, time |-> BigIntSubtract(ns2, ns1)])
       [] corrected.error # "" -> corrected
       [] OTHER -> TOk([date |-> TDateUntil(calendar, start.date, corrected.value.date, TLargerUnit(largestUnit, "day")),
                        time |-> corrected.value.time])

\* DifferenceZonedDateTimeWithRounding.
LOCAL TZonedDifferenceRounded(calendar, ns1, ns2, zone, settings) ==
  LET difference == TZonedDifference(calendar, ns1, ns2, zone, settings.largest)
      rounded == TRoundToIncrement(BigIntSubtract(ns2, ns1),
                                   BigIntMultiply(settings.increment, TUnitLength(settings.smallest)), settings.mode)
  IN CASE ~TIsDateUnit(settings.largest) -> TOk([date |-> <<Big :> 0, Big :> 0, Big :> 0, Big :> 0>>, time |-> rounded])
       [] difference.error # "" -> difference
       [] settings.smallest = "nanosecond" /\ settings.increment = Big :> 1 -> difference
       [] OTHER -> TRoundRelative(calendar, difference.value.date, difference.value.time, ns1, ns2, TLocal(zone, ns1), zone,
                                  settings.largest, settings.increment, settings.smallest, settings.mode)

\* DifferenceZonedDateTimeWithTotal, as a Number.
LOCAL TZonedDifferenceTotal(calendar, ns1, ns2, zone, unit) ==
  LET difference == TZonedDifference(calendar, ns1, ns2, zone, unit)
      sign == IF TDurationSign(<<difference.value.date[1], difference.value.date[2], difference.value.date[3],
                                 difference.value.date[4], difference.value.time>>) < 0 THEN -1 ELSE 1
      nudge == TNudgeToCalendarUnit(calendar, sign, difference.value.date, ns1, ns2, TLocal(zone, ns1), zone, Big :> 1, unit, "trunc")
      time == BigIntAdd(difference.value.time, BigIntMultiply(difference.value.date[4], TNsPerDay))
  IN CASE ~TIsDateUnit(unit) -> TOk(TQuotientNumber(BigIntSubtract(ns2, ns1), TUnitLength(unit)))
       [] difference.error # "" -> difference
       [] nudge.error # "" -> nudge
       [] OTHER -> TOk(TSignedQuotientNumber(nudge.value.totalNumerator, nudge.value.totalDenominator))

\* Temporal.ZonedDateTime.prototype.until and since.
LOCAL TZonedDifferenceDuration(heap, slots, other, options, isSince) ==
  LET converted == TToZoned(heap, other, Undefined)
      resolved == TOptions(heap, options)
      settings == TDifferenceSettings(heap, isSince, resolved.value, "datetime", {}, "nanosecond", "hour")
      isTime == ~TIsDateUnit(settings.value.largest)
      difference == TZonedDifferenceRounded(slots.calendar, slots.ns, converted.value.ns, slots.zone, settings.value)
  IN CASE converted.error # "" -> converted
       [] converted.value.calendar # slots.calendar -> TFail("RangeError")
       [] resolved.error # "" -> resolved
       [] settings.error # "" -> settings
       [] isTime -> TDifferenceDuration(difference, settings.value.largest, isSince)
       [] ~TZoneEquals(converted.value.zone, slots.zone) -> TFail("RangeError")
       [] slots.ns = converted.value.ns -> TOk(TZeroDuration)
       [] OTHER -> TDifferenceDuration(difference, "hour", isSince)

\* Temporal.ZonedDateTime.prototype.round, as the epoch nanoseconds.
LOCAL TZonedRound(heap, slots, roundTo) ==
  LET options == IF TypeOf(roundTo) = "string" THEN TOk(Undefined) ELSE TOptions(heap, roundTo)
      increment == TRoundingIncrementOption(heap, options.value)
      mode == TRoundingModeOption(heap, options.value, "halfExpand")
      smallest == IF TypeOf(roundTo) = "string" THEN TUnitOf(heap, roundTo, "smallestUnit") ELSE TUnitOption(heap, options.value, "smallestUnit")
      isValidIncrement ==
        IF smallest.value = "day"
        THEN TIncrementValid(increment.value, 1, TRUE)
        ELSE TIncrementValid(increment.value, TMaximumIncrement(smallest.value), FALSE)
      local == TLocal(slots.zone, slots.ns)
      startNs == TStartOfDay(slots.zone, local.date)
      endNs == TStartOfDay(slots.zone, TAddDays(local.date, 1))
      dayNs == BigIntAdd(startNs.value, TRoundToIncrement(BigIntSubtract(slots.ns, startNs.value),
                                                          BigIntSubtract(endNs.value, startNs.value), mode.value))
      rounded == TRoundTime(local.time, increment.value, smallest.value, mode.value)
      roundedNs == TInterpretOffset(TAddDays(local.date, TSmall(rounded.days)), rounded.time, TRUE, "option",
                                    TZoneOffset(slots.zone, slots.ns), slots.zone, "compatible", "prefer", FALSE)
  IN CASE roundTo = Undefined -> TFail("TypeError")
       [] options.error # "" -> options
       [] increment.error # "" -> increment
       [] mode.error # "" -> mode
       [] smallest.error # "" -> smallest
       [] smallest.value = "unset" -> TFail("RangeError")
       [] ~TUnitValid(smallest.value, "time", {"day"}) -> TFail("RangeError")
       [] ~isValidIncrement -> TFail("RangeError")
       [] smallest.value = "nanosecond" /\ increment.value = Big :> 1 -> TOk(slots.ns)
       [] smallest.value = "day" ->
            CASE startNs.error # "" -> startNs [] endNs.error # "" -> endNs [] OTHER -> TOk(dayNs)
       [] OTHER -> roundedNs

\* TemporalZonedDateTimeToString.
LOCAL TZonedText(slots, precision, show, showZone, showOffset, mode) ==
  LET ns == TRoundToIncrementAsIfPositive(slots.ns, BigIntMultiply(TBig(precision.increment), TUnitLength(precision.unit)),
                                          mode)
      local == TLocal(slots.zone, ns)
  IN TDateText(local.date) \o "T" \o TTimeText(local.time, precision.precision)
       \o (IF showOffset = "never" THEN "" ELSE TOffsetText(TZoneOffset(slots.zone, ns)))
       \o (IF showZone = "never" THEN "" ELSE "[" \o (IF showZone = "critical" THEN "!" ELSE "") \o slots.zone.id \o "]")
       \o TCalendarText(slots.calendar, show)

\* Temporal.ZonedDateTime.prototype.toString.
LOCAL TZonedToString(heap, slots, value) ==
  LET options == TOptions(heap, value)
      show == TCalendarNameOption(heap, options.value)
      digits == TDigitsOption(heap, options.value)
      showOffset == TStringOf(heap, TOption(heap, options.value, "offset"), "offset", {"auto", "never"}, "auto")
      mode == TRoundingModeOption(heap, options.value, "trunc")
      smallest == TUnitOption(heap, options.value, "smallestUnit")
      showZone == TStringOf(heap, TOption(heap, options.value, "timeZoneName"), "timeZoneName", {"auto", "never", "critical"}, "auto")
      precision == TPrecision(smallest.value, digits.value)
  IN CASE options.error # "" -> options
       [] show.error # "" -> show
       [] digits.error # "" -> digits
       [] showOffset.error # "" -> showOffset
       [] mode.error # "" -> mode
       [] smallest.error # "" -> smallest
       [] showZone.error # "" -> showZone
       [] ~TUnitValid(smallest.value, "time", {}) \/ smallest.value = "hour" -> TFail("RangeError")
       [] OTHER -> TOk(TZonedText(slots, precision, show.value, showZone.value, showOffset.value, mode.value))

\* Temporal.ZonedDateTime.prototype.with, as the epoch nanoseconds.
LOCAL TZonedWith(heap, slots, like, options) ==
  LET local == TLocal(slots.zone, slots.ns)
      partial == TPrepareFields(heap, like, slots.calendar, TDateTimeKeys \cup {"offset"}, {}, TRUE)
      fields == [TDateFields(local.date, local.time, TRUE, slots.calendar) EXCEPT !["offset"] = TZoneOffset(slots.zone, slots.ns)]
      merged == TMergeFields(fields, partial.value)
      resolved == TOptions(heap, options)
      disambiguation == TDisambiguationOption(heap, resolved.value)
      offsetOption == TOffsetOption(heap, resolved.value, "prefer")
      overflow == TOverflowOption(heap, resolved.value)
      date == TDateFromFields(merged, overflow.value, slots.calendar)
      time == TRegulateTime(TTimeOfFields(merged), overflow.value)
  IN CASE ~TIsPartial(heap, like) -> TFail("TypeError")
       [] partial.error # "" -> partial
       [] resolved.error # "" -> resolved
       [] disambiguation.error # "" -> disambiguation
       [] offsetOption.error # "" -> offsetOption
       [] overflow.error # "" -> overflow
       [] date.error # "" -> date
       [] time.error # "" -> time
       [] OTHER -> TInterpretOffset(date.value, time.value, TRUE, "option", merged["offset"], slots.zone,
                                    disambiguation.value, offsetOption.value, FALSE)

\* ---------------------------------------------------------------------------------------------
\* Rounding, totaling, and comparing durations, relative to a plain date where relativeTo is one.

\* GetTemporalRelativeToOption, as a record whose kind is "none", "plain" with its date, or "zoned"
\* with its epoch nanoseconds and time zone.
LOCAL TRelativeTo(heap, options) ==
  LET value == TOption(heap, options, "relativeTo")
      slots == TSlots(heap, value)
      calendar == TCalendarOfBag(heap, value)
      fields == TPrepareFields(heap, value, calendar.value, TDateTimeKeys \cup {"offset", "timeZone"}, {}, FALSE)
      date == TDateFromFields(fields.value, "constrain", calendar.value)
      time == TRegulateTime(TTimeOfFields(fields.value), "constrain")
      bagNs == TInterpretOffset(date.value, time.value, TRUE,
                                IF fields.value["offset"] = Undefined THEN "wall" ELSE "option",
                                IF fields.value["offset"] = Undefined THEN Big :> 0 ELSE fields.value["offset"],
                                fields.value["timeZone"], "compatible", "reject", FALSE)
      zoned == TParseISO(value, "ZonedDateTime")
      parsed == IF zoned.error = "" THEN zoned ELSE TParseISO(value, "DateTime")
      zone == TZoneOfName(parsed.value.zone)
      parsedCalendar == IF parsed.value.calendar = "" THEN TOk("iso8601") ELSE TCalendar(parsed.value.calendar)
      offsetParse == TOffsetAt(parsed.value.offset, 1, TRUE)
      parsedNs == TInterpretOffset(parsed.value.date, parsed.value.time, parsed.value.hasTime,
                                   CASE parsed.value.z -> "exact" [] parsed.value.offset = "" -> "wall" [] OTHER -> "option",
                                   IF parsed.value.offset = "" THEN Big :> 0 ELSE offsetParse.ns,
                                   zone.value, "compatible", "reject", ~offsetParse.hasSecond)
  IN CASE value = Undefined -> TOk([kind |-> "none", calendar |-> "iso8601"])
       [] slots.kind = "ZonedDateTime" ->
            TOk([kind |-> "zoned", ns |-> slots.ns, zone |-> slots.zone, calendar |-> slots.calendar])
       [] slots.kind \in {"PlainDate", "PlainDateTime"} ->
            TOk([kind |-> "plain", date |-> slots.date, calendar |-> slots.calendar])
       [] TIsObject(heap, value) ->
            CASE calendar.error # "" -> calendar
              [] fields.error # "" -> fields
              [] date.error # "" -> date
              [] time.error # "" -> time
              [] fields.value["timeZone"] = Undefined ->
                   TOk([kind |-> "plain", date |-> date.value, calendar |-> calendar.value])
              [] bagNs.error # "" -> bagNs
              [] OTHER ->
                   TOk([kind |-> "zoned", ns |-> bagNs.value, zone |-> fields.value["timeZone"],
                        calendar |-> calendar.value])
       [] TypeOf(value) # "string" -> TFail("TypeError")
       [] parsed.error # "" -> parsed
       [] parsed.value.zone # "" /\ zone.error # "" -> zone
       [] parsedCalendar.error # "" -> parsedCalendar
       [] parsed.value.zone = "" ->
            IF TDateWithinLimits(parsed.value.date)
            THEN TOk([kind |-> "plain", date |-> parsed.value.date, calendar |-> parsedCalendar.value])
            ELSE TFail("RangeError")
       [] parsedNs.error # "" -> parsedNs
       [] OTHER -> TOk([kind |-> "zoned", ns |-> parsedNs.value, zone |-> zone.value, calendar |-> parsedCalendar.value])

\* The date and time that adding a duration with 24-hour days to midnight of a date gives.
LOCAL TRelativeTarget(calendar, fields, date) ==
  LET target == TBalanceTime(TMidnight, BigIntAdd(TTimeOf(fields), BigIntMultiply(fields[4], TNsPerDay)))
      added == TDateAdd(calendar, date, <<fields[1], fields[2], fields[3], target.days>>, "constrain")
  IN IF added.error # "" THEN added ELSE TOk([date |-> added.value, time |-> target.time])

\* Temporal.Duration.prototype.round.
LOCAL TDurationRound(heap, fields, roundTo) ==
  LET options == IF TypeOf(roundTo) = "string" THEN TOk(Undefined) ELSE TOptions(heap, roundTo)
      unitOf(key) ==
        IF TypeOf(roundTo) = "string"
        THEN IF key = "smallestUnit" THEN TUnitOf(heap, roundTo, "smallestUnit") ELSE TOk("unset")
        ELSE TUnitOption(heap, options.value, key)
      largest == unitOf("largestUnit")
      relative == IF TypeOf(roundTo) = "string" THEN TOk([kind |-> "none"]) ELSE TRelativeTo(heap, options.value)
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
      target == TRelativeTarget(relative.value.calendar, fields, relative.value.date)
      settings == [largest |-> largestUnit, increment |-> increment.value, smallest |-> smallestUnit, mode |-> mode.value]
      difference == TDifferenceRounded(relative.value.calendar, relative.value.date, TMidnight, target.value.date, target.value.time, settings)
      zonedTarget == TZonedAdd(relative.value.calendar, relative.value.ns, relative.value.zone, <<fields[1], fields[2], fields[3], fields[4]>>,
                               TTimeOf(fields), "constrain")
      zonedDifference == TZonedDifferenceRounded(relative.value.calendar, relative.value.ns, zonedTarget.value, relative.value.zone, settings)
  IN CASE roundTo = Undefined -> TFail("TypeError")
       [] options.error # "" -> options
       [] largest.error # "" -> largest
       [] relative.error # "" -> relative
       [] increment.error # "" -> increment
       [] mode.error # "" -> mode
       [] smallest.error # "" -> smallest
       [] ~TUnitValid(smallest.value, "datetime", {}) -> TFail("RangeError")
       [] smallest.value = "unset" /\ largest.value = "unset" -> TFail("RangeError")
       [] TLargerUnit(largestUnit, smallestUnit) # largestUnit -> TFail("RangeError")
       [] maximum # 0 /\ ~TIncrementValid(increment.value, maximum, FALSE) -> TFail("RangeError")
       [] TLess(Big :> 1, increment.value) /\ largestUnit # smallestUnit /\ TIsDateUnit(smallestUnit) ->
            TFail("RangeError")
       [] relative.value.kind = "zoned" ->
            CASE zonedTarget.error # "" -> zonedTarget
              [] zonedDifference.error # "" -> zonedDifference
              [] OTHER -> TDurationFromInternal(zonedDifference.value.date, zonedDifference.value.time,
                                                IF TIsDateUnit(largestUnit) THEN "hour" ELSE largestUnit)
       [] relative.value.kind = "plain" ->
            CASE target.error # "" -> target
              [] difference.error # "" -> difference
              [] OTHER -> TDurationFromInternal(difference.value.date, difference.value.time, largestUnit)
       [] TIsCalendarUnit(existing) \/ TIsCalendarUnit(largestUnit) -> TFail("RangeError")
       [] TLess(TMaxTimeDuration, TAbs(rounded)) -> TFail("RangeError")
       [] smallestUnit = "day" ->
            TDurationFromInternal(<<Big :> 0, Big :> 0, Big :> 0, BigIntDivide(rounded, TNsPerDay)>>, Big :> 0,
                                  largestUnit)
       [] OTHER -> TDurationFromInternal(<<Big :> 0, Big :> 0, Big :> 0, Big :> 0>>, rounded, largestUnit)

\* DifferencePlainDateTimeWithTotal, as a Number.
LOCAL TDifferenceTotal(calendar, date1, date2, time2, unit) ==
  LET difference == TDifferenceDateTime(calendar, date1, TMidnight, date2, time2, unit)
      sign == IF TDurationSign(<<difference.date[1], difference.date[2], difference.date[3], difference.date[4],
                                 difference.time>>) < 0 THEN -1 ELSE 1
      nudge == TNudgeToCalendarUnit(calendar, sign, difference.date, TEpochNs(date1, TMidnight), TEpochNs(date2, time2),
                                    [date |-> date1, time |-> TMidnight], TNoZone, Big :> 1, unit, "trunc")
      time == BigIntAdd(difference.time, BigIntMultiply(difference.date[4], TNsPerDay))
  IN CASE TCompareSequences(date1 \o TMidnight, date2 \o time2) = 0 -> TOk(0)
       [] ~TDateTimeWithinLimits(date1, TMidnight) \/ ~TDateTimeWithinLimits(date2, time2) -> TFail("RangeError")
       [] unit = "nanosecond" -> TOk(NumberOfBigInt(difference.time))
       [] TIsCalendarUnit(unit) ->
            IF nudge.error # "" THEN nudge
            ELSE TOk(TSignedQuotientNumber(nudge.value.totalNumerator, nudge.value.totalDenominator))
       [] OTHER -> TOk(TQuotientNumber(time, TUnitLength(unit)))

\* Temporal.Duration.prototype.total, as the total.
LOCAL TDurationTotal(heap, fields, totalOf) ==
  LET options == IF TypeOf(totalOf) = "string" THEN TOk(Undefined) ELSE TOptions(heap, totalOf)
      relative == IF TypeOf(totalOf) = "string" THEN TOk([kind |-> "none"]) ELSE TRelativeTo(heap, options.value)
      unit == IF TypeOf(totalOf) = "string"
              THEN TUnitOf(heap, totalOf, "unit")
              ELSE TUnitOption(heap, options.value, "unit")
      time == BigIntAdd(TTimeOf(fields), BigIntMultiply(fields[4], TNsPerDay))
      target == TRelativeTarget(relative.value.calendar, fields, relative.value.date)
      zonedTarget == TZonedAdd(relative.value.calendar, relative.value.ns, relative.value.zone, <<fields[1], fields[2], fields[3], fields[4]>>,
                               TTimeOf(fields), "constrain")
  IN CASE totalOf = Undefined -> TFail("TypeError")
       [] options.error # "" -> options
       [] relative.error # "" -> relative
       [] unit.error # "" -> unit
       [] unit.value = "unset" -> TFail("RangeError")
       [] ~TUnitValid(unit.value, "datetime", {}) -> TFail("RangeError")
       [] relative.value.kind = "zoned" ->
            IF zonedTarget.error # "" THEN zonedTarget
            ELSE TZonedDifferenceTotal(relative.value.calendar, relative.value.ns, zonedTarget.value, relative.value.zone, unit.value)
       [] relative.value.kind = "plain" ->
            IF target.error # "" THEN target
            ELSE TDifferenceTotal(relative.value.calendar, relative.value.date, target.value.date, target.value.time, unit.value)
       [] TIsCalendarUnit(TDefaultLargestUnit(fields)) \/ TIsCalendarUnit(unit.value) -> TFail("RangeError")
       [] OTHER -> TOk(TQuotientNumber(time, TUnitLength(unit.value)))

\* DateDurationDays.
LOCAL TDurationDays(calendar, fields, date) ==
  LET later == TDateAdd(calendar, date, <<fields[1], fields[2], fields[3], Big :> 0>>, "constrain")
  IN CASE TIsZero(fields[1]) /\ TIsZero(fields[2]) /\ TIsZero(fields[3]) -> TOk(fields[4])
       [] later.error # "" -> later
       [] OTHER -> TOk(BigIntAdd(fields[4], TBig(TEpochDays(later.value) - TEpochDays(date))))

\* Temporal.Duration.compare, as a number.
LOCAL TDurationCompare(heap, one, two, value) ==
  LET first == TToDuration(heap, one)
      second == TToDuration(heap, two)
      options == TOptions(heap, value)
      relative == TRelativeTo(heap, options.value)
      isCalendar == TIsCalendarUnit(TDefaultLargestUnit(first.value)) \/ TIsCalendarUnit(TDefaultLargestUnit(second.value))
      days1 == IF isCalendar THEN TDurationDays(relative.value.calendar, first.value, relative.value.date) ELSE TOk(first.value[4])
      days2 == IF isCalendar THEN TDurationDays(relative.value.calendar, second.value, relative.value.date) ELSE TOk(second.value[4])
      total1 == BigIntAdd(TTimeOf(first.value), BigIntMultiply(days1.value, TNsPerDay))
      total2 == BigIntAdd(TTimeOf(second.value), BigIntMultiply(days2.value, TNsPerDay))
      after(fields) == TZonedAdd(relative.value.calendar, relative.value.ns, relative.value.zone, <<fields[1], fields[2], fields[3], fields[4]>>,
                                 TTimeOf(fields), "constrain")
      after1 == after(first.value)
      after2 == after(second.value)
  IN CASE first.error # "" -> first
       [] second.error # "" -> second
       [] options.error # "" -> options
       [] relative.error # "" -> relative
       [] first.value = second.value -> TOk(0)
       [] relative.value.kind = "zoned" /\ (TIsDateUnit(TDefaultLargestUnit(first.value)) \/ TIsDateUnit(TDefaultLargestUnit(second.value))) ->
            CASE after1.error # "" -> after1 [] after2.error # "" -> after2 [] OTHER -> TOk(TCompare(after1.value, after2.value))
       [] isCalendar /\ relative.value.kind = "none" -> TFail("RangeError")
       [] days1.error # "" -> days1
       [] days2.error # "" -> days2
       [] TLess(TMaxTimeDuration, TAbs(total1)) \/ TLess(TMaxTimeDuration, TAbs(total2)) -> TFail("RangeError")
       [] OTHER -> TOk(TCompare(total1, total2))

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
      smallest == IF TypeOf(roundTo) = "string" THEN TUnitOf(heap, roundTo, "smallestUnit") ELSE TUnitOption(heap, options.value, "smallestUnit")
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
  LET partial == TPrepareFields(heap, like, "iso8601", TTimeKeys, {}, TRUE)
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
LOCAL TDateAddDuration(calendar, heap, date, other, options, isSubtract) ==
  LET converted == TToDuration(heap, other)
      fields == IF isSubtract THEN TNegatedDuration(converted.value) ELSE converted.value
      total == BigIntAdd(TTimeOf(fields), BigIntMultiply(fields[4], TNsPerDay))
      resolved == TOptions(heap, options)
      overflow == TOverflowOption(heap, resolved.value)
  IN CASE converted.error # "" -> converted
       [] resolved.error # "" -> resolved
       [] overflow.error # "" -> overflow
       [] OTHER -> TDateAdd(calendar, date, <<fields[1], fields[2], fields[3], BigIntDivide(total, TNsPerDay)>>, overflow.value)

\* AddDurationToDateTime, as the date and the time.
LOCAL TDateTimeAddDuration(calendar, heap, date, time, other, options, isSubtract) ==
  LET converted == TToDuration(heap, other)
      fields == IF isSubtract THEN TNegatedDuration(converted.value) ELSE converted.value
      resolved == TOptions(heap, options)
      overflow == TOverflowOption(heap, resolved.value)
      total == BigIntAdd(TTimeOf(fields), BigIntMultiply(fields[4], TNsPerDay))
      balanced == TBalanceTime(time, total)
      dates == <<fields[1], fields[2], fields[3], balanced.days>>
      added == TDateAdd(calendar, date, dates, overflow.value)
  IN CASE converted.error # "" -> converted
       [] resolved.error # "" -> resolved
       [] overflow.error # "" -> overflow
       [] ~TDateDurationValid(dates) -> TFail("RangeError")
       [] added.error # "" -> added
       [] ~TDateTimeWithinLimits(added.value, balanced.time) -> TFail("RangeError")
       [] OTHER -> TOk([date |-> added.value, time |-> balanced.time])

\* Temporal.PlainDate.prototype.until and since.
LOCAL TDateDifference(heap, date, calendar, other, options, isSince) ==
  LET converted == TToDate(heap, other, Undefined)
      resolved == TOptions(heap, options)
      settings == TDifferenceSettings(heap, isSince, resolved.value, "date", {}, "day", "day")
      dates == TDateUntil(calendar, date, converted.value.date, settings.value.largest)
      isRounded == settings.value.smallest # "day" \/ settings.value.increment # Big :> 1
      rounded == TRoundRelative(calendar, dates, Big :> 0, TEpochNs(date, TMidnight), TEpochNs(converted.value.date, TMidnight),
                                [date |-> date, time |-> TMidnight], TNoZone, settings.value.largest,
                                settings.value.increment, settings.value.smallest, settings.value.mode)
  IN CASE converted.error # "" -> converted
       [] converted.value.calendar # calendar -> TFail("RangeError")
       [] resolved.error # "" -> resolved
       [] settings.error # "" -> settings
       [] TCompareSequences(date, converted.value.date) = 0 -> TOk(TZeroDuration)
       [] isRounded -> TDifferenceDuration(rounded, "day", isSince)
       [] OTHER -> TDifferenceDuration(TOk([date |-> dates, time |-> Big :> 0]), "day", isSince)

\* Temporal.PlainDateTime.prototype.until and since.
LOCAL TDateTimeDifference(heap, date, time, calendar, other, options, isSince) ==
  LET converted == TToDateTime(heap, other, Undefined)
      resolved == TOptions(heap, options)
      settings == TDifferenceSettings(heap, isSince, resolved.value, "datetime", {}, "nanosecond", "day")
  IN CASE converted.error # "" -> converted
       [] converted.value.calendar # calendar -> TFail("RangeError")
       [] resolved.error # "" -> resolved
       [] settings.error # "" -> settings
       [] TCompareSequences(date \o time, converted.value.date \o converted.value.time) = 0 -> TOk(TZeroDuration)
       [] OTHER -> TDifferenceDuration(TDifferenceRounded(calendar, date, time, converted.value.date, converted.value.time,
                                                          settings.value),
                                       settings.value.largest, isSince)

\* Temporal.PlainDateTime.prototype.round, as the date and the time.
LOCAL TDateTimeRound(heap, date, time, roundTo) ==
  LET options == IF TypeOf(roundTo) = "string" THEN TOk(Undefined) ELSE TOptions(heap, roundTo)
      increment == TRoundingIncrementOption(heap, options.value)
      mode == TRoundingModeOption(heap, options.value, "halfExpand")
      smallest == IF TypeOf(roundTo) = "string" THEN TUnitOf(heap, roundTo, "smallestUnit") ELSE TUnitOption(heap, options.value, "smallestUnit")
      isValidIncrement ==
        IF smallest.value = "day"
        THEN TIncrementValid(increment.value, 1, TRUE)
        ELSE TIncrementValid(increment.value, TMaximumIncrement(smallest.value), FALSE)
      rounded == TRoundTime(time, increment.value, smallest.value, mode.value)
      roundedDate == TAddDays(date, TSmall(rounded.days))
  IN CASE roundTo = Undefined -> TFail("TypeError")
       [] options.error # "" -> options
       [] increment.error # "" -> increment
       [] mode.error # "" -> mode
       [] smallest.error # "" -> smallest
       [] smallest.value = "unset" -> TFail("RangeError")
       [] ~TUnitValid(smallest.value, "time", {"day"}) -> TFail("RangeError")
       [] ~isValidIncrement -> TFail("RangeError")
       [] ~TDateTimeWithinLimits(roundedDate, rounded.time) -> TFail("RangeError")
       [] OTHER -> TOk([date |-> roundedDate, time |-> rounded.time])

\* Temporal.PlainDate.prototype.with, as the date.
LOCAL TDateWith(heap, date, calendar, like, options) ==
  LET partial == TPrepareFields(heap, like, calendar, {"year", "month", "monthCode", "day"}, {}, TRUE)
      resolved == TOptions(heap, options)
      overflow == TOverflowOption(heap, resolved.value)
  IN CASE ~TIsPartial(heap, like) -> TFail("TypeError")
       [] partial.error # "" -> partial
       [] resolved.error # "" -> resolved
       [] overflow.error # "" -> overflow
       [] OTHER -> TDateFromFields(TMergeFields(TDateFields(date, TMidnight, FALSE, calendar), partial.value),
                                   overflow.value, calendar)

\* Temporal.PlainDateTime.prototype.with, as the date and the time.
LOCAL TDateTimeWith(heap, date, time, calendar, like, options) ==
  LET partial == TPrepareFields(heap, like, calendar, TDateTimeKeys, {}, TRUE)
      resolved == TOptions(heap, options)
      overflow == TOverflowOption(heap, resolved.value)
      merged == TMergeFields(TDateFields(date, time, TRUE, calendar), partial.value)
      madeDate == TDateFromFields(merged, overflow.value, calendar)
      madeTime == TRegulateTime(TTimeOfFields(merged), overflow.value)
  IN CASE ~TIsPartial(heap, like) -> TFail("TypeError")
       [] partial.error # "" -> partial
       [] resolved.error # "" -> resolved
       [] overflow.error # "" -> overflow
       [] madeDate.error # "" -> madeDate
       [] madeTime.error # "" -> madeTime
       [] ~TDateTimeWithinLimits(madeDate.value, madeTime.value) -> TFail("RangeError")
       [] OTHER -> TOk([date |-> madeDate.value, time |-> madeTime.value])

\* The time of a constructor's arguments from a position, each undefined as 0.
LOCAL TTimeArguments(heap, arguments, first) ==
  [position \in 1..6 |->
     IF TArgument(arguments, first + position - 1) = Undefined
     THEN TOk(Big :> 0)
     ELSE TTruncated(heap, TArgument(arguments, first + position - 1), TArgumentLabel(first + position - 1))]

\* A constructor's calendar argument.
LOCAL TCalendarArgument(value) ==
  CASE value = Undefined -> TOk("iso8601")
    [] TypeOf(value) # "string" \/ IsRef(value) -> TFail("TypeError")
    [] OTHER -> TCalendar(value)

\* ---------------------------------------------------------------------------------------------
\* Instants, year-months, and month-days.

\* ToBigInt of a value that a Temporal function reads.
LOCAL TPrimitiveBigInt(value) ==
  CASE IsBigInt(value) -> TOk(value)
    [] TypeOf(value) = "boolean" -> TOk(Big :> IF value THEN 1 ELSE 0)
    [] TypeOf(value) = "string" -> Assert(FALSE, "tla-ts can't convert a string to a BigInt here")
    [] OTHER -> TFail("TypeError")

LOCAL TToBigInt(heap, value, label) ==
  CASE IsRef(value) \/ IsSequenceValue(value) ->
         IF TIsAnswered(heap, "bigint", label, value)
         THEN TPrimitiveBigInt(TAnswer(heap, "bigint", label, value))
         ELSE TPending("bigint", label, value)
    [] OTHER -> TPrimitiveBigInt(value)

\* ToTemporalInstant, as the epoch nanoseconds.
LOCAL TToInstant(heap, item) ==
  LET slots == TSlots(heap, item)
      parsed == TParseISO(item, "Instant")
      offset == IF parsed.value.z THEN Big :> 0 ELSE TOffsetAt(parsed.value.offset, 1, TRUE).ns
      ns == BigIntSubtract(TEpochNs(parsed.value.date, parsed.value.time), offset)
  IN CASE slots.kind \in {"Instant", "ZonedDateTime"} -> TOk(slots.ns)
       [] IsRef(item) \/ IsSequenceValue(item) ->
            Assert(FALSE, "tla-ts can't convert an object that a Temporal function reads to a string")
       [] TypeOf(item) # "string" -> TFail("TypeError")
       [] parsed.error # "" -> parsed
       [] ~TIsValidEpochNs(ns) -> TFail("RangeError")
       [] OTHER -> TOk(ns)

\* The epoch nanoseconds that adding a duration to an instant gives.
LOCAL TInstantAdd(heap, ns, other, isSubtract) ==
  LET converted == TToDuration(heap, other)
      fields == IF isSubtract THEN TNegatedDuration(converted.value) ELSE converted.value
      result == BigIntAdd(ns, TTimeOf(fields))
  IN CASE converted.error # "" -> converted
       [] TIsDateUnit(TDefaultLargestUnit(fields)) -> TFail("RangeError")
       [] ~TIsValidEpochNs(result) -> TFail("RangeError")
       [] OTHER -> TOk(result)

\* Temporal.Instant.prototype.until and since.
LOCAL TInstantDifference(heap, ns, other, options, isSince) ==
  LET converted == TToInstant(heap, other)
      resolved == TOptions(heap, options)
      settings == TDifferenceSettings(heap, isSince, resolved.value, "time", {}, "nanosecond", "second")
      rounded == TRoundToIncrement(BigIntSubtract(converted.value, ns),
                                   BigIntMultiply(settings.value.increment, TUnitLength(settings.value.smallest)),
                                   settings.value.mode)
  IN CASE converted.error # "" -> converted
       [] resolved.error # "" -> resolved
       [] settings.error # "" -> settings
       [] OTHER -> TDifferenceDuration(TOk([date |-> <<Big :> 0, Big :> 0, Big :> 0, Big :> 0>>, time |-> rounded]),
                                       settings.value.largest, isSince)

\* ValidateTemporalRoundingIncrement of a dividend that a BigInt holds, inclusive.
LOCAL TIncrementDivides(increment, dividend) ==
  ~TLess(dividend, increment) /\ TIsZero(BigIntRemainder(dividend, increment))

\* Temporal.Instant.prototype.round, as the epoch nanoseconds.
LOCAL TInstantRound(heap, ns, roundTo) ==
  LET options == IF TypeOf(roundTo) = "string" THEN TOk(Undefined) ELSE TOptions(heap, roundTo)
      increment == TRoundingIncrementOption(heap, options.value)
      mode == TRoundingModeOption(heap, options.value, "halfExpand")
      smallest == IF TypeOf(roundTo) = "string" THEN TUnitOf(heap, roundTo, "smallestUnit") ELSE TUnitOption(heap, options.value, "smallestUnit")
      length == TUnitLength(smallest.value)
  IN CASE roundTo = Undefined -> TFail("TypeError")
       [] options.error # "" -> options
       [] increment.error # "" -> increment
       [] mode.error # "" -> mode
       [] smallest.error # "" -> smallest
       [] smallest.value = "unset" -> TFail("RangeError")
       [] ~TUnitValid(smallest.value, "time", {}) -> TFail("RangeError")
       [] ~TIncrementDivides(increment.value, BigIntDivide(TNsPerDay, length)) -> TFail("RangeError")
       [] OTHER -> TOk(TRoundToIncrementAsIfPositive(ns, BigIntMultiply(increment.value, length), mode.value))

\* Temporal.Instant.prototype.toString.
LOCAL TInstantToString(heap, ns, value) ==
  LET options == TOptions(heap, value)
      digits == TDigitsOption(heap, options.value)
      mode == TRoundingModeOption(heap, options.value, "trunc")
      smallest == TUnitOption(heap, options.value, "smallestUnit")
      zoneValue == TOption(heap, options.value, "timeZone")
      zone == IF zoneValue = Undefined THEN TOk(TUTC) ELSE TTimeZone(heap, zoneValue)
      precision == TPrecision(smallest.value, digits.value)
      rounded == TRoundToIncrementAsIfPositive(ns, BigIntMultiply(TBig(precision.increment), TUnitLength(precision.unit)),
                                               mode.value)
      local == TLocal(zone.value, rounded)
  IN CASE options.error # "" -> options
       [] digits.error # "" -> digits
       [] mode.error # "" -> mode
       [] smallest.error # "" -> smallest
       [] ~TUnitValid(smallest.value, "time", {}) \/ smallest.value = "hour" -> TFail("RangeError")
       [] zone.error # "" -> zone
       [] OTHER -> TOk(TDateText(local.date) \o "T" \o TTimeText(local.time, precision.precision)
                         \o (IF zoneValue = Undefined THEN "Z" ELSE TOffsetText(TZoneOffset(zone.value, rounded))))

\* ISOYearMonthWithinLimits.
LOCAL TYearMonthWithinLimits(date) ==
  /\ date[1] >= -271821 /\ date[1] <= 275760
  /\ date[1] = -271821 => date[2] >= 4
  /\ date[1] = 275760 => date[2] <= 9

\* CalendarYearMonthFromFields.
LOCAL TYearMonthFromFields(fields, overflow, calendar) ==
  LET month == TResolveFields(fields, "year-month", calendar)
      date == TRegulateCalendarDate(calendar, month.value.year, month.value.month, 1, month.value.code, overflow)
  IN CASE month.error # "" -> month
       [] date.error # "" -> date
       [] ~TYearMonthWithinLimits(date.value) -> TFail("RangeError")
       [] OTHER -> date

\* NonISOMonthDayToISOReferenceDate of a calendar whose months have their own lengths.
LOCAL TSimpleMonthDay(fields, overflow, calendar) ==
  LET resolved == TResolveFields(fields, "month-day", calendar)
      year == resolved.value.year
      kept == TYearOf(year)
      months == IF year = Undefined THEN 13 ELSE TSimpleMonths(calendar, kept)
      month == IF resolved.value.month > months THEN months ELSE resolved.value.month
      given == resolved.value.code
      code == CASE year = Undefined -> given
                [] given = Undefined -> TSimpleCode(calendar, kept, month)
                [] TYearHasCode(calendar, kept, given) -> given
                [] OTHER -> [month |-> 6, isLeap |-> FALSE]
      days == IF year = Undefined
              THEN TSimpleMostDays(calendar, code)
              ELSE TSimpleDaysInMonth(calendar, kept, month)
      day == TFieldOf(fields["day"])
      reference == TSimpleDateOf(calendar, TRataDie(<<1972, 12, 31>>))[1]
  IN CASE resolved.error # "" -> resolved
       [] year # Undefined /\ ~(TIsYearKept(kept) /\ TSimpleYearWithinLimits(calendar, kept)) ->
            TFail("RangeError")
       [] overflow = "reject" /\ year # Undefined /\ given # Undefined /\ ~TYearHasCode(calendar, kept, given) ->
            TFail("RangeError")
       [] overflow = "reject" /\ (resolved.value.month > months \/ day > days) -> TFail("RangeError")
       [] OTHER -> TOk(TSimpleReference(calendar, reference, code, IF day > days THEN days ELSE day))

\* CalendarMonthDayFromFields, whose year, where the fields give one, only decides how long the
\* month is, and must be within the limits in a calendar other than the ISO 8601 calendar. Each
\* calendar whose months are the ISO 8601 calendar's takes 1972 as the reference year.
LOCAL TMonthDayFromFields(fields, overflow, calendar) ==
  IF calendar \in TSimpleCalendars
  THEN TSimpleMonthDay(fields, overflow, calendar)
  ELSE LET resolved == TResolveFields(fields, "month-day", calendar)
      month == IF resolved.error # "" THEN resolved ELSE TOk(resolved.value.month)
      year == IF resolved.value.year = Undefined
              THEN Undefined
              ELSE BigIntSubtract(resolved.value.year, TBig(TYearOffset(calendar)))
      isLeap == year = Undefined \/ TIsLeapBig(year)
      day == TFieldOf(fields["day"])
      daysInMonth == IF month.value = 2 THEN (IF isLeap THEN 29 ELSE 28) ELSE TDaysInMonth(1972, month.value)
      clampedMonth == IF month.value < 1 THEN 1 ELSE IF month.value > 12 THEN 12 ELSE month.value
      clampedDays == IF clampedMonth = 2 THEN (IF isLeap THEN 29 ELSE 28) ELSE TDaysInMonth(1972, clampedMonth)
  IN CASE month.error # "" -> month
       [] calendar # "iso8601" /\ year # Undefined /\
          (TLess(year, TBig(-271821)) \/ TLess(TBig(275760), year)) -> TFail("RangeError")
       [] overflow = "constrain" ->
            TOk(<<1972, clampedMonth, IF day < 1 THEN 1 ELSE IF day > clampedDays THEN clampedDays ELSE day>>)
       [] month.value < 1 \/ month.value > 12 \/ day < 1 \/ day > daysInMonth -> TFail("RangeError")
       [] OTHER -> TOk(<<1972, month.value, day>>)

LOCAL TDateOf(step, calendar) == IF step.error # "" THEN step ELSE TOk([date |-> step.value, calendar |-> calendar])

\* ISODateToFields of a year-month or a month-day: its month code, and its year or its day.
LOCAL TPartFields(date, isYearMonth, calendar) ==
  [TDateFields(date, TMidnight, FALSE, calendar) EXCEPT ![IF isYearMonth THEN "day" ELSE "year"] = Undefined]

\* ToTemporalYearMonth, as the date and the calendar.
LOCAL TToYearMonth(heap, item, options) ==
  LET slots == TSlots(heap, item)
      resolved == TOptions(heap, options)
      overflow == TOverflowOption(heap, resolved.value)
      calendar == TCalendarOfBag(heap, item)
      fields == TPrepareFields(heap, item, calendar.value, {"year", "month", "monthCode"}, {}, FALSE)
      made == TYearMonthFromFields(fields.value, overflow.value, calendar.value)
      parsed == TParseISO(item, "YearMonth")
      parsedCalendar == IF parsed.value.calendar = "" THEN TOk("iso8601") ELSE TCalendar(parsed.value.calendar)
      checked(next) == CASE resolved.error # "" -> resolved [] overflow.error # "" -> overflow [] OTHER -> next
  IN CASE slots.kind = "PlainYearMonth" -> checked(TOk([date |-> slots.date, calendar |-> slots.calendar]))
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
       [] ~TYearMonthWithinLimits(parsed.value.date) -> checked(TFail("RangeError"))
       [] parsedCalendar.value \in TSimpleCalendars ->
            checked(TDateOf(TYearMonthFromFields(TDateFields(parsed.value.date, TMidnight, FALSE, parsedCalendar.value),
                                                 "constrain", parsedCalendar.value),
                            parsedCalendar.value))
       [] OTHER ->
            checked(TOk([date |-> <<parsed.value.date[1], parsed.value.date[2], 1>>, calendar |-> parsedCalendar.value]))

\* ToTemporalMonthDay, as the date and the calendar.
LOCAL TToMonthDay(heap, item, options) ==
  LET slots == TSlots(heap, item)
      resolved == TOptions(heap, options)
      overflow == TOverflowOption(heap, resolved.value)
      calendar == TCalendarOfBag(heap, item)
      fields == TPrepareFields(heap, item, calendar.value, {"year", "month", "monthCode", "day"}, {}, FALSE)
      made == TMonthDayFromFields(fields.value, overflow.value, calendar.value)
      parsed == TParseISO(item, "MonthDay")
      parsedCalendar == IF parsed.value.calendar = "" THEN TOk("iso8601") ELSE TCalendar(parsed.value.calendar)
      checked(next) == CASE resolved.error # "" -> resolved [] overflow.error # "" -> overflow [] OTHER -> next
  IN CASE slots.kind = "PlainMonthDay" -> checked(TOk([date |-> slots.date, calendar |-> slots.calendar]))
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
       [] parsedCalendar.value # "iso8601" /\ ~TDateWithinLimits(parsed.value.date) -> checked(TFail("RangeError"))
       [] parsedCalendar.value \in TSimpleCalendars ->
            checked(TDateOf(TMonthDayFromFields(TPartFields(parsed.value.date, FALSE, parsedCalendar.value),
                                                "constrain", parsedCalendar.value),
                            parsedCalendar.value))
       [] OTHER -> checked(TOk([date |-> <<1972, parsed.value.date[2], parsed.value.date[3]>>, calendar |-> parsedCalendar.value]))

\* The first day of a year-month as a date, which may be before the limits.
LOCAL TFirstOfMonth(calendar, date) ==
  TDateFromFields([TDateFields(date, TMidnight, FALSE, calendar) EXCEPT !["day"] = Big :> 1], "constrain", calendar)

\* AddDurationToYearMonth, as the date.
LOCAL TYearMonthAdd(calendar, heap, date, other, options, isSubtract) ==
  LET converted == TToDuration(heap, other)
      fields == IF isSubtract THEN TNegatedDuration(converted.value) ELSE converted.value
      resolved == TOptions(heap, options)
      overflow == TOverflowOption(heap, resolved.value)
      first == TFirstOfMonth(calendar, date)
      added == TDateAdd(calendar, first.value, <<fields[1], fields[2], Big :> 0, Big :> 0>>, overflow.value)
      made == TYearMonthFromFields(TDateFields(added.value, TMidnight, FALSE, calendar), overflow.value, calendar)
  IN CASE converted.error # "" -> converted
       [] resolved.error # "" -> resolved
       [] overflow.error # "" -> overflow
       [] ~TIsZero(fields[3]) \/ ~TIsZero(fields[4]) \/ ~TIsZero(TTimeOf(fields)) -> TFail("RangeError")
       [] first.error # "" -> first
       [] added.error # "" -> added
       [] OTHER -> made

\* Temporal.PlainYearMonth.prototype.until and since.
LOCAL TYearMonthDifference(heap, date, calendar, other, options, isSince) ==
  LET converted == TToYearMonth(heap, other, Undefined)
      resolved == TOptions(heap, options)
      settings == TDifferenceSettings(heap, isSince, resolved.value, "date", {"week", "day"}, "month", "year")
      this == TFirstOfMonth(calendar, date)
      that == TFirstOfMonth(calendar, converted.value.date)
      dates == TDateUntil(calendar, this.value, that.value, settings.value.largest)
      yearsMonths == <<dates[1], dates[2], Big :> 0, Big :> 0>>
      isRounded == settings.value.smallest # "month" \/ settings.value.increment # Big :> 1
      rounded == TRoundRelative(calendar, yearsMonths, Big :> 0, TEpochNs(this.value, TMidnight), TEpochNs(that.value, TMidnight),
                                [date |-> this.value, time |-> TMidnight], TNoZone, settings.value.largest,
                                settings.value.increment, settings.value.smallest, settings.value.mode)
  IN CASE converted.error # "" -> converted
       [] converted.value.calendar # calendar -> TFail("RangeError")
       [] resolved.error # "" -> resolved
       [] settings.error # "" -> settings
       [] TCompareSequences(date, converted.value.date) = 0 -> TOk(TZeroDuration)
       [] this.error # "" -> this
       [] that.error # "" -> that
       [] isRounded -> TDifferenceDuration(rounded, "day", isSince)
       [] OTHER -> TDifferenceDuration(TOk([date |-> yearsMonths, time |-> Big :> 0]), "day", isSince)

\* ---------------------------------------------------------------------------------------------

LOCAL TObject(prototype, slots) == [EmptyObject EXCEPT !.prototype = prototype] @@ [temporal |-> slots]

\* What a Temporal function gives: the error that it throws, or "", the heap after it, and its value.
\* The heap that a Temporal function reads, with the answers to the conversions it asked for.
TemporalHeap(heap, answers) ==
  [key \in DOMAIN heap \cup {"answers"} |-> IF key = "answers" THEN answers ELSE heap[key]]

\* The objects that a Temporal function may read from its arguments: those that they hold, and
\* those that their data properties hold, but for functions, whose properties it doesn't read.
LOCAL TReadable(heap, value) == IsHeap(value) /\ ~heap.objects[value[Ref]].isCallable

\* The objects that an object's data properties hold, which a set of objects alone holds, as TLC
\* can't compare an object with every other value.
LOCAL TDataObjects(heap, ref) ==
  LET object == heap.objects[ref[Ref]]
  IN {object.values[key] :
        key \in {other \in DOMAIN object.values :
                   object.attributes[other].kind = "data" /\ TReadable(heap, object.values[other])}}

RECURSIVE TemporalReached(_, _, _)
TemporalReached(heap, frontier, seen) ==
  IF frontier = {}
  THEN seen
  ELSE LET next == UNION {TDataObjects(heap, ref) : ref \in frontier} \ (seen \cup frontier)
       IN TemporalReached(heap, next, seen \cup frontier)

\* Whether the objects that a Temporal function read from its arguments before a conversion that it
\* asked for are as they were, so that it reads them again as it would have read them then.
TemporalInputsKept(before, after, inputs) ==
  LET held(sequence) == {sequence[index] : index \in {other \in DOMAIN sequence : TReadable(before, sequence[other])}}
      roots == held(inputs)
                 \cup UNION {held(inputs[position]) :
                              position \in {other \in DOMAIN inputs : IsSequenceValue(inputs[other])}}
  IN /\ before.changed = after.changed
     /\ \A ref \in TemporalReached(before, roots, {}) : after.objects[ref[Ref]] = before.objects[ref[Ref]]

LOCAL TPlainHeap(heap) ==
  IF "answers" \in DOMAIN heap THEN [key \in DOMAIN heap \ {"answers"} |-> heap[key]] ELSE heap

LOCAL TGives(heap, step) ==
  [error |-> step.error, heap |-> TPlainHeap(heap), value |-> step.value,
   request |-> IF "request" \in DOMAIN step THEN step.request ELSE Undefined]

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

\* The getters of a year and a month in a calendar: its era, era year, and arithmetic year.
LOCAL TYearGetters(date, calendar) ==
  LET parts == TCalendarParts(calendar, date)
      year == parts[1]
      era == TEraOfDate(calendar, date, year)
      isISO == calendar = "iso8601"
      isSimple == calendar \in TSimpleCalendars
  IN [calendarId |-> calendar, era |-> IF isISO THEN Undefined ELSE era[1],
      eraYear |-> IF isISO THEN Undefined ELSE era[2], year |-> year, month |-> parts[2],
      monthCode |-> TCodeText(TCalendarCode(calendar, date)),
      daysInMonth |-> IF isSimple THEN TSimpleDaysInMonth(calendar, year, parts[2]) ELSE TDaysInMonth(date[1], date[2]),
      daysInYear |-> IF isSimple
                     THEN TSimpleRataDie(calendar, year + 1, 1, 1) - TSimpleRataDie(calendar, year, 1, 1)
                     ELSE TDaysInYear(date[1]),
      monthsInYear |-> TCalendarMonths(calendar, year),
      inLeapYear |-> IF isSimple THEN TSimpleLeap(calendar, year) ELSE TIsLeapYear(date[1])]

\* The getters of a date, whose week of the year only the ISO 8601 calendar numbers.
LOCAL TDateGetters(date, calendar) ==
  LET week == IF calendar = "iso8601" THEN TWeekOfYear(date) ELSE <<Undefined, Undefined>>
      parts == TCalendarParts(calendar, date)
  IN TYearGetters(date, calendar)
       @@ [day |-> parts[3], dayOfWeek |-> TDayOfWeek(date),
           dayOfYear |-> IF calendar \in TSimpleCalendars
                         THEN TRataDie(date) - TSimpleRataDie(calendar, parts[1], 1, 1) + 1
                         ELSE TDayOfYear(date),
           weekOfYear |-> week[1], yearOfWeek |-> week[2], daysInWeek |-> 7]

\* The slots of a Temporal object of a kind, from what a step gives: a duration's fields, a time, or
\* a record of a date, a time, and a calendar.
LOCAL TSlotsOf(kind, value) ==
  CASE kind = "Duration" -> TDurationSlots(value)
    [] kind = "PlainTime" -> [kind |-> kind, time |-> value, getters |-> TTimeGetters(value)]
    [] kind = "PlainDate" ->
         [kind |-> kind, date |-> value.date, calendar |-> value.calendar,
          getters |-> TDateGetters(value.date, value.calendar)]
    [] kind = "PlainDateTime" ->
         [kind |-> kind, date |-> value.date, time |-> value.time, calendar |-> value.calendar,
          getters |-> TDateGetters(value.date, value.calendar) @@ TTimeGetters(value.time)]
    [] kind = "Instant" ->
         [kind |-> kind, ns |-> value,
          getters |-> [epochMilliseconds |-> NumberOfBigInt(TFloorDivide(value, Big :> 1000000)),
                       epochNanoseconds |-> value]]
    [] kind = "PlainYearMonth" ->
         [kind |-> kind, date |-> value.date, calendar |-> value.calendar,
          getters |-> TYearGetters(value.date, value.calendar)]
    [] kind = "ZonedDateTime" ->
         LET local == TLocal(value.zone, value.ns)
             offset == TZoneOffset(value.zone, value.ns)
         IN [kind |-> kind, ns |-> value.ns, zone |-> value.zone, calendar |-> value.calendar, date |-> local.date,
             time |-> local.time,
             getters |-> TDateGetters(local.date, value.calendar) @@ TTimeGetters(local.time)
                           @@ [timeZoneId |-> value.zone.id,
                               epochMilliseconds |-> NumberOfBigInt(TFloorDivide(value.ns, Big :> 1000000)),
                               epochNanoseconds |-> value.ns,
                               offsetNanoseconds |-> NumberOfBigInt(offset),
                               offset |-> TOffsetFullText(offset)]]
    [] kind = "PlainMonthDay" ->
         [kind |-> kind, date |-> value.date, calendar |-> value.calendar,
          getters |-> [calendarId |-> value.calendar,
                       monthCode |-> TCodeText(TCalendarCode(value.calendar, value.date)),
                       day |-> TCalendarParts(value.calendar, value.date)[3]]]

\* The heap with a new Temporal object of a kind whose slots a step gives, and the object.
LOCAL TMakes(heap, prototype, kind, step) ==
  IF step.error # ""
  THEN TGives(heap, step)
  ELSE LET made == Allocate(TPlainHeap(heap), TObject(prototype, TSlotsOf(kind, step.value)))
       IN [error |-> "", heap |-> made, value |-> Allocated(made), request |-> Undefined]

\* A step's value with a calendar.
LOCAL TWithCalendar(step, calendar) ==
  IF step.error # "" THEN step ELSE TOk([calendar |-> calendar] @@ step.value)

\* new of a Temporal constructor.
TemporalNew(heap, kind, arguments, prototype) ==
  CASE kind = "Duration" ->
         LET converted == [position \in 1..10 |->
                             IF TArgument(arguments, position) = Undefined
                             THEN TOk(Big :> 0)
                             ELSE TIntegral(heap, TArgument(arguments, position), TArgumentLabel(position))]
             error == TFirstError(converted)
         IN TMakes(heap, prototype, kind,
                   IF error # "" THEN TFirstFailed(converted)
                   ELSE TCheckedDuration([position \in 1..10 |-> converted[position].value]))
    [] kind = "PlainTime" ->
         LET converted == TTimeArguments(heap, arguments, 1)
             error == TFirstError(converted)
             time == [position \in 1..6 |-> TFieldOf(converted[position].value)]
         IN TMakes(heap, prototype, kind,
                   CASE error # "" -> TFirstFailed(converted)
                     [] ~TIsValidTime(time) -> TFail("RangeError")
                     [] OTHER -> TOk(time))
    [] kind \in {"PlainDate", "PlainDateTime"} ->
         LET converted == [position \in 1..3 |->
                             TTruncated(heap, TArgument(arguments, position), TArgumentLabel(position))]
                            \o (IF kind = "PlainDate" THEN <<>> ELSE TTimeArguments(heap, arguments, 4))
             error == TFirstError(converted)
             calendar == TCalendarArgument(TArgument(arguments, IF kind = "PlainDate" THEN 4 ELSE 10))
             date == <<TYearOf(converted[1].value), TFieldOf(converted[2].value), TFieldOf(converted[3].value)>>
             time == IF kind = "PlainDate" THEN TMidnight ELSE [position \in 1..6 |-> TFieldOf(converted[position + 3].value)]
         IN TMakes(heap, prototype, kind,
                   CASE error # "" -> TFirstFailed(converted)
                     [] calendar.error # "" -> calendar
                     [] ~TIsYearKept(date[1]) \/ ~TIsValidDate(date[1], date[2], date[3]) -> TFail("RangeError")
                     [] ~TIsValidTime(time) -> TFail("RangeError")
                     [] kind = "PlainDate" /\ ~TDateWithinLimits(date) -> TFail("RangeError")
                     [] kind = "PlainDateTime" /\ ~TDateTimeWithinLimits(date, time) -> TFail("RangeError")
                     [] OTHER -> TOk([date |-> date, time |-> time, calendar |-> calendar.value]))
    [] kind = "Instant" ->
         LET ns == TToBigInt(heap, TArgument(arguments, 1), TArgumentLabel(1))
         IN TMakes(heap, prototype, kind,
                   CASE ns.error # "" -> ns [] ~TIsValidEpochNs(ns.value) -> TFail("RangeError") [] OTHER -> ns)
    [] kind = "ZonedDateTime" ->
         LET ns == TToBigInt(heap, TArgument(arguments, 1), TArgumentLabel(1))
             zoneArgument == TArgument(arguments, 2)
             zone == TTimeZoneIdentifier(zoneArgument)
             calendar == TCalendarArgument(TArgument(arguments, 3))
         IN TMakes(heap, prototype, kind,
                   CASE ns.error # "" -> ns
                     [] ~TIsValidEpochNs(ns.value) -> TFail("RangeError")
                     [] TypeOf(zoneArgument) # "string" \/ IsRef(zoneArgument) -> TFail("TypeError")
                     [] zone.error # "" -> zone
                     [] calendar.error # "" -> calendar
                     [] OTHER -> TOk([ns |-> ns.value, zone |-> zone.value, calendar |-> calendar.value]))
    [] kind \in {"PlainYearMonth", "PlainMonthDay"} ->
         LET isYearMonth == kind = "PlainYearMonth"
             converted == [position \in 1..2 |->
                             TTruncated(heap, TArgument(arguments, position), TArgumentLabel(position))]
             error == TFirstError(converted)
             calendar == TCalendarArgument(TArgument(arguments, 3))
             reference == IF TArgument(arguments, 4) = Undefined
                          THEN TOk(TBig(IF isYearMonth THEN 1 ELSE 1972))
                          ELSE TTruncated(heap, TArgument(arguments, 4), TArgumentLabel(4))
             date == IF isYearMonth
                     THEN <<TYearOf(converted[1].value), TFieldOf(converted[2].value), TFieldOf(reference.value)>>
                     ELSE <<TYearOf(reference.value), TFieldOf(converted[1].value), TFieldOf(converted[2].value)>>
         IN TMakes(heap, prototype, kind,
                   CASE error # "" -> TFirstFailed(converted)
                     [] calendar.error # "" -> calendar
                     [] reference.error # "" -> reference
                     [] ~TIsYearKept(date[1]) \/ ~TIsValidDate(date[1], date[2], date[3]) -> TFail("RangeError")
                     [] isYearMonth /\ ~TYearMonthWithinLimits(date) -> TFail("RangeError")
                     [] ~isYearMonth /\ ~TDateWithinLimits(date) -> TFail("RangeError")
                     [] OTHER -> TOk([date |-> date, calendar |-> calendar.value]))
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
       [] kind = "PlainDateTime" /\ method = "from" -> TMakes(heap, prototype, kind, TToDateTime(heap, first, second))
       [] kind = "PlainDateTime" /\ method = "compare" ->
            LET one == TToDateTime(heap, first, Undefined)
                two == TToDateTime(heap, second, Undefined)
            IN TGives(heap, CASE one.error # "" -> one [] two.error # "" -> two
                              [] OTHER -> TOk(TCompareSequences(one.value.date \o one.value.time,
                                                                two.value.date \o two.value.time)))
       [] kind = "Instant" /\ method = "from" -> TMakes(heap, prototype, kind, TToInstant(heap, first))
       [] kind = "Instant" /\ method = "fromEpochNanoseconds" ->
            LET ns == TToBigInt(heap, first, TArgumentLabel(1))
            IN TMakes(heap, prototype, kind,
                      CASE ns.error # "" -> ns [] ~TIsValidEpochNs(ns.value) -> TFail("RangeError") [] OTHER -> ns)
       [] kind = "Instant" /\ method = "fromEpochMilliseconds" ->
            LET number == TToNumber(heap, first, TArgumentLabel(1))
                ns == BigIntMultiply(ToBigInt(number.value), Big :> 1000000)
            IN TMakes(heap, prototype, kind,
                      CASE number.error # "" -> number
                        [] ~IsIntegral(number.value) -> TFail("RangeError")
                        [] ~TIsValidEpochNs(ns) -> TFail("RangeError")
                        [] OTHER -> TOk(ns))
       [] kind = "Instant" /\ method = "compare" ->
            LET one == TToInstant(heap, first)
                two == TToInstant(heap, second)
            IN TGives(heap, CASE one.error # "" -> one [] two.error # "" -> two
                              [] OTHER -> TOk(TCompare(one.value, two.value)))
       [] kind = "PlainYearMonth" /\ method = "from" -> TMakes(heap, prototype, kind, TToYearMonth(heap, first, second))
       [] kind = "PlainYearMonth" /\ method = "compare" ->
            LET one == TToYearMonth(heap, first, Undefined)
                two == TToYearMonth(heap, second, Undefined)
            IN TGives(heap, CASE one.error # "" -> one [] two.error # "" -> two
                              [] OTHER -> TOk(TCompareSequences(one.value.date, two.value.date)))
       [] kind = "PlainMonthDay" /\ method = "from" -> TMakes(heap, prototype, kind, TToMonthDay(heap, first, second))
       [] kind = "ZonedDateTime" /\ method = "from" -> TMakes(heap, prototype, kind, TToZoned(heap, first, second))
       [] kind = "ZonedDateTime" /\ method = "compare" ->
            LET one == TToZoned(heap, first, Undefined)
                two == TToZoned(heap, second, Undefined)
            IN TGives(heap, CASE one.error # "" -> one [] two.error # "" -> two
                              [] OTHER -> TOk(TCompare(one.value.ns, two.value.ns)))
       [] OTHER -> Assert(FALSE, "tla-ts can't call Temporal." \o kind \o "." \o method)

\* A call of Temporal.Instant.prototype's method.
LOCAL TInstantMethod(heap, slots, method, arguments, prototype) ==
  LET ns == slots.ns
      first == TArgument(arguments, 1)
      second == TArgument(arguments, 2)
      other == TToInstant(heap, first)
  IN CASE method = "add" -> TMakes(heap, prototype, "Instant", TInstantAdd(heap, ns, first, FALSE))
       [] method = "subtract" -> TMakes(heap, prototype, "Instant", TInstantAdd(heap, ns, first, TRUE))
       [] method = "until" -> TMakes(heap, prototype, "Duration", TInstantDifference(heap, ns, first, second, FALSE))
       [] method = "since" -> TMakes(heap, prototype, "Duration", TInstantDifference(heap, ns, first, second, TRUE))
       [] method = "round" -> TMakes(heap, prototype, "Instant", TInstantRound(heap, ns, first))
       [] method = "equals" -> TGives(heap, IF other.error # "" THEN other ELSE TOk(ns = other.value))
       [] method = "toString" -> TGives(heap, TInstantToString(heap, ns, first))
       [] method = "toJSON" -> TGives(heap, TInstantToString(heap, ns, Undefined))
       [] method = "toZonedDateTimeISO" ->
            LET zone == TTimeZone(heap, first)
            IN TMakes(heap, prototype, "ZonedDateTime",
                      IF zone.error # "" THEN zone ELSE TOk([ns |-> ns, zone |-> zone.value, calendar |-> "iso8601"]))

\* A call of Temporal.PlainYearMonth.prototype's or Temporal.PlainMonthDay.prototype's method.
LOCAL TYearMonthOrMonthDayMethod(heap, slots, method, arguments, prototype) ==
  LET date == slots.date
      calendar == slots.calendar
      isYearMonth == slots.kind = "PlainYearMonth"
      first == TArgument(arguments, 1)
      second == TArgument(arguments, 2)
      other == IF isYearMonth THEN TToYearMonth(heap, first, Undefined) ELSE TToMonthDay(heap, first, Undefined)
      options == TOptions(heap, first)
      show == TCalendarNameOption(heap, options.value)
      isFull(showing) == showing \in {"always", "critical"} \/ calendar # "iso8601"
      text(showing) ==
        IF isYearMonth
        THEN TYearText(date[1]) \o "-" \o TTwoDigits(date[2])
               \o (IF isFull(showing) THEN "-" \o TTwoDigits(date[3]) ELSE "")
               \o TCalendarText(calendar, showing)
        ELSE (IF isFull(showing) THEN TYearText(date[1]) \o "-" ELSE "")
               \o TTwoDigits(date[2]) \o "-" \o TTwoDigits(date[3]) \o TCalendarText(calendar, showing)
      names == IF isYearMonth THEN {"year", "month", "monthCode"} ELSE {"year", "month", "monthCode", "day"}
      partial == TPrepareFields(heap, first, calendar, names, {}, TRUE)
      resolved == TOptions(heap, second)
      overflow == TOverflowOption(heap, resolved.value)
      merged == TMergeFields(TPartFields(date, isYearMonth, calendar), partial.value)
      withMade == IF isYearMonth
                  THEN TYearMonthFromFields(merged, overflow.value, calendar)
                  ELSE TMonthDayFromFields(merged, overflow.value, calendar)
      input == TPrepareFields(heap, first, calendar, IF isYearMonth THEN {"day"} ELSE {"year"}, {}, FALSE)
      dated == TDateFromFields(TMergeFields(TPartFields(date, isYearMonth, calendar), input.value), "constrain",
                               calendar)
  IN CASE method \in {"add", "subtract"} ->
            TMakes(heap, prototype, "PlainYearMonth",
                   TDateOf(TYearMonthAdd(calendar, heap, date, first, second, method = "subtract"), calendar))
       [] method \in {"until", "since"} ->
            TMakes(heap, prototype, "Duration",
                   TYearMonthDifference(heap, date, calendar, first, second, method = "since"))
       [] method = "with" ->
            TMakes(heap, prototype, slots.kind,
                   CASE ~TIsPartial(heap, first) -> TFail("TypeError")
                     [] partial.error # "" -> partial
                     [] resolved.error # "" -> resolved
                     [] overflow.error # "" -> overflow
                     [] OTHER -> TDateOf(withMade, calendar))
       [] method = "equals" ->
            TGives(heap, IF other.error # "" THEN other
                         ELSE TOk(TCompareSequences(date, other.value.date) = 0 /\ calendar = other.value.calendar))
       [] method = "toString" ->
            TGives(heap, CASE options.error # "" -> options [] show.error # "" -> show [] OTHER -> TOk(text(show.value)))
       [] method = "toJSON" -> TGives(heap, TOk(text("auto")))
       [] method = "toPlainDate" ->
            TMakes(heap, prototype, "PlainDate",
                   CASE ~TIsObject(heap, first) -> TFail("TypeError")
                     [] input.error # "" -> input
                     [] OTHER -> TDateOf(dated, calendar))

\* A call of Temporal.ZonedDateTime.prototype's method.
LOCAL TZonedMethod(heap, slots, method, arguments, prototype) ==
  LET first == TArgument(arguments, 1)
      second == TArgument(arguments, 2)
      made(step) == IF step.error # "" THEN step ELSE TOk([ns |-> step.value, zone |-> slots.zone, calendar |-> slots.calendar])
      other == TToZoned(heap, first, Undefined)
      converted == TToDuration(heap, first)
      fields == IF method = "subtract" THEN TNegatedDuration(converted.value) ELSE converted.value
      resolved == TOptions(heap, second)
      overflow == TOverflowOption(heap, resolved.value)
      added == TZonedAdd(slots.calendar, slots.ns, slots.zone, <<fields[1], fields[2], fields[3], fields[4]>>, TTimeOf(fields),
                         overflow.value)
      newTime == TToTime(heap, first, Undefined)
      withZone == TTimeZone(heap, first)
      withCalendar == TCalendarIdentifier(heap, first)
      direction == IF TypeOf(first) = "string" THEN TOk(Undefined) ELSE TOptions(heap, first)
      directionValue == IF TypeOf(first) = "string" THEN first ELSE TOption(heap, direction.value, "direction")
      directionText == TStringOf(heap, directionValue, "direction", {"next", "previous"}, "unset")
  IN CASE method \in {"add", "subtract"} ->
            TMakes(heap, prototype, "ZonedDateTime",
                   CASE converted.error # "" -> converted
                     [] resolved.error # "" -> resolved
                     [] overflow.error # "" -> overflow
                     [] OTHER -> made(added))
       [] method = "with" -> TMakes(heap, prototype, "ZonedDateTime", made(TZonedWith(heap, slots, first, second)))
       [] method = "withPlainTime" ->
            TMakes(heap, prototype, "ZonedDateTime",
                   CASE first = Undefined -> made(TStartOfDay(slots.zone, slots.date))
                     [] newTime.error # "" -> newTime
                     [] OTHER -> made(TZonedNs(slots.zone, slots.date, newTime.value)))
       [] method = "withTimeZone" ->
            TMakes(heap, prototype, "ZonedDateTime",
                   IF withZone.error # "" THEN withZone
                   ELSE TOk([ns |-> slots.ns, zone |-> withZone.value, calendar |-> slots.calendar]))
       [] method = "withCalendar" ->
            TMakes(heap, prototype, "ZonedDateTime",
                   IF withCalendar.error # "" THEN withCalendar
                   ELSE TOk([ns |-> slots.ns, zone |-> slots.zone, calendar |-> withCalendar.value]))
       [] method \in {"until", "since"} ->
            TMakes(heap, prototype, "Duration", TZonedDifferenceDuration(heap, slots, first, second, method = "since"))
       [] method = "round" -> TMakes(heap, prototype, "ZonedDateTime", made(TZonedRound(heap, slots, first)))
       [] method = "equals" ->
            TGives(heap, IF other.error # "" THEN other
                         ELSE TOk(slots.ns = other.value.ns /\ TZoneEquals(slots.zone, other.value.zone)
                                  /\ slots.calendar = other.value.calendar))
       [] method = "toString" -> TGives(heap, TZonedToString(heap, slots, first))
       [] method = "toJSON" -> TGives(heap, TOk(TZonedText(slots, TPrecision("unset", -1), "auto", "auto", "auto", "trunc")))
       [] method = "startOfDay" -> TMakes(heap, prototype, "ZonedDateTime", made(TStartOfDay(slots.zone, slots.date)))
       [] method = "getTimeZoneTransition" ->
            LET transition == IF directionText.value = "next"
                              THEN TNextTransition(slots.zone, slots.ns)
                              ELSE TPreviousTransition(slots.zone, slots.ns)
            IN CASE first = Undefined -> TGives(heap, TFail("TypeError"))
                 [] direction.error # "" -> TGives(heap, direction)
                 [] directionText.error # "" -> TGives(heap, directionText)
                 [] directionText.value = "unset" -> TGives(heap, TFail("RangeError"))
                 [] transition = Null -> TGives(heap, TOk(Null))
                 [] OTHER -> TMakes(heap, prototype, "ZonedDateTime", made(TOk(transition)))
       [] method = "toInstant" -> TMakes(heap, prototype, "Instant", TOk(slots.ns))
       [] method = "toPlainDate" -> TMakes(heap, prototype, "PlainDate", TOk([date |-> slots.date, calendar |-> slots.calendar]))
       [] method = "toPlainTime" -> TMakes(heap, prototype, "PlainTime", TOk(slots.time))
       [] method = "toPlainDateTime" ->
            TMakes(heap, prototype, "PlainDateTime",
                   TOk([date |-> slots.date, time |-> slots.time, calendar |-> slots.calendar]))

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
            TMakes(heap, prototype, "PlainDate", TDateOf(TDateAddDuration(calendar, heap, date, first, second, FALSE), calendar))
       [] method = "subtract" ->
            TMakes(heap, prototype, "PlainDate", TDateOf(TDateAddDuration(calendar, heap, date, first, second, TRUE), calendar))
       [] method = "with" -> TMakes(heap, prototype, "PlainDate", TDateOf(TDateWith(heap, date, calendar, first, second), calendar))
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
       [] method = "toZonedDateTime" ->
            LET zoneLike == IF TIsObject(heap, first) THEN TGet(heap, first, "timeZone") ELSE Undefined
                zone == IF TIsObject(heap, first) /\ zoneLike # Undefined THEN TTimeZone(heap, zoneLike) ELSE TTimeZone(heap, first)
                plainTime == IF TIsObject(heap, first) /\ zoneLike # Undefined THEN TGet(heap, first, "plainTime") ELSE Undefined
                converted == TToTime(heap, plainTime, Undefined)
                ns == IF plainTime = Undefined
                      THEN TStartOfDay(zone.value, date)
                      ELSE IF TDateTimeWithinLimits(date, converted.value)
                           THEN TZonedNs(zone.value, date, converted.value)
                           ELSE TFail("RangeError")
            IN TMakes(heap, prototype, "ZonedDateTime",
                      CASE zone.error # "" -> zone
                        [] plainTime # Undefined /\ converted.error # "" -> converted
                        [] ns.error # "" -> ns
                        [] OTHER -> TOk([ns |-> ns.value, zone |-> zone.value, calendar |-> calendar]))
       [] method = "toPlainYearMonth" ->
            TMakes(heap, prototype, "PlainYearMonth",
                   TDateOf(TYearMonthFromFields(TDateFields(date, TMidnight, FALSE, calendar), "constrain", calendar),
                           calendar))
       [] method = "toPlainMonthDay" ->
            TMakes(heap, prototype, "PlainMonthDay",
                   TDateOf(TMonthDayFromFields(TDateFields(date, TMidnight, FALSE, calendar), "constrain", calendar),
                           calendar))

\* A call of Temporal.PlainDateTime.prototype's method.
LOCAL TDateTimeMethod(heap, slots, method, arguments, prototype) ==
  LET date == slots.date
      time == slots.time
      calendar == slots.calendar
      first == TArgument(arguments, 1)
      second == TArgument(arguments, 2)
      other == TToDateTime(heap, first, Undefined)
      options == TTimeTextOptions(heap, first, TRUE)
      rounded == TRoundTime(time, TBig(options.value.precision.increment), options.value.precision.unit,
                            options.value.mode)
      roundedDate == TAddDays(date, TSmall(rounded.days))
      newTime == IF first = Undefined THEN TOk(TMidnight) ELSE TToTime(heap, first, Undefined)
      withCalendar == TCalendarIdentifier(heap, first)
      text(at, clock, precision, show) ==
        TDateText(at) \o "T" \o TTimeText(clock, precision) \o TCalendarText(calendar, show)
  IN CASE method = "add" ->
            TMakes(heap, prototype, "PlainDateTime",
                   TWithCalendar(TDateTimeAddDuration(calendar, heap, date, time, first, second, FALSE), calendar))
       [] method = "subtract" ->
            TMakes(heap, prototype, "PlainDateTime",
                   TWithCalendar(TDateTimeAddDuration(calendar, heap, date, time, first, second, TRUE), calendar))
       [] method = "with" ->
            TMakes(heap, prototype, "PlainDateTime", TWithCalendar(TDateTimeWith(heap, date, time, calendar, first, second), calendar))
       [] method = "withPlainTime" ->
            TMakes(heap, prototype, "PlainDateTime",
                   CASE newTime.error # "" -> newTime
                     [] ~TDateTimeWithinLimits(date, newTime.value) -> TFail("RangeError")
                     [] OTHER -> TOk([date |-> date, time |-> newTime.value, calendar |-> calendar]))
       [] method = "withCalendar" ->
            TMakes(heap, prototype, "PlainDateTime",
                   IF withCalendar.error # "" THEN withCalendar
                   ELSE TOk([date |-> date, time |-> time, calendar |-> withCalendar.value]))
       [] method = "until" ->
            TMakes(heap, prototype, "Duration", TDateTimeDifference(heap, date, time, calendar, first, second, FALSE))
       [] method = "since" ->
            TMakes(heap, prototype, "Duration", TDateTimeDifference(heap, date, time, calendar, first, second, TRUE))
       [] method = "round" ->
            TMakes(heap, prototype, "PlainDateTime", TWithCalendar(TDateTimeRound(heap, date, time, first), calendar))
       [] method = "equals" ->
            TGives(heap, IF other.error # "" THEN other
                         ELSE TOk(TCompareSequences(date \o time, other.value.date \o other.value.time) = 0
                                  /\ calendar = other.value.calendar))
       [] method = "toString" ->
            TGives(heap, CASE options.error # "" -> options
                           [] ~TDateTimeWithinLimits(roundedDate, rounded.time) -> TFail("RangeError")
                           [] OTHER -> TOk(text(roundedDate, rounded.time, options.value.precision.precision,
                                                options.value.show)))
       [] method = "toJSON" -> TGives(heap, TOk(text(date, time, -1, "auto")))
       [] method = "toPlainDate" -> TMakes(heap, prototype, "PlainDate", TOk([date |-> date, calendar |-> calendar]))
       [] method = "toPlainTime" -> TMakes(heap, prototype, "PlainTime", TOk(time))
       [] method = "toZonedDateTime" ->
            LET zone == TTimeZone(heap, first)
                resolved == TOptions(heap, second)
                disambiguation == TDisambiguationOption(heap, resolved.value)
                ns == TZonedNsWith(zone.value, date, time, disambiguation.value)
            IN TMakes(heap, prototype, "ZonedDateTime",
                      CASE zone.error # "" -> zone
                        [] resolved.error # "" -> resolved
                        [] disambiguation.error # "" -> disambiguation
                        [] ns.error # "" -> ns
                        [] OTHER -> TOk([ns |-> ns.value, zone |-> zone.value, calendar |-> calendar]))

\* A call of a Temporal prototype's method on a receiver.
TemporalMethod(heap, kind, method, receiver, arguments, prototype) ==
  LET slots == TSlots(heap, receiver)
  IN CASE method = "valueOf" -> TGives(heap, TFail("TypeError"))
       [] slots.kind # kind -> TGives(heap, TFail("TypeError"))
       [] kind = "Duration" -> TDurationMethod(heap, slots, method, arguments, prototype)
       [] kind = "PlainTime" -> TTimeMethod(heap, slots, method, arguments, prototype)
       [] kind = "PlainDate" -> TDateMethod(heap, slots, method, arguments, prototype)
       [] kind = "PlainDateTime" -> TDateTimeMethod(heap, slots, method, arguments, prototype)
       [] kind = "Instant" -> TInstantMethod(heap, slots, method, arguments, prototype)
       [] kind \in {"PlainYearMonth", "PlainMonthDay"} ->
            TYearMonthOrMonthDayMethod(heap, slots, method, arguments, prototype)
       [] kind = "ZonedDateTime" -> TZonedMethod(heap, slots, method, arguments, prototype)

\* Temporal.ZonedDateTime.prototype.hoursInDay, which stops where it would throw at the limits.
TemporalHoursInDay(slots) ==
  LET today == TStartOfDay(slots.zone, slots.date)
      tomorrow == TStartOfDay(slots.zone, TAddDays(slots.date, 1))
  IN IF today.error = "" /\ tomorrow.error = ""
     THEN TQuotientNumber(BigIntSubtract(tomorrow.value, today.value), BigIntMultiply(Big :> 3600, TNsPerSecond))
     ELSE Assert(FALSE, "tla-ts can't throw the RangeError of Temporal.ZonedDateTime.prototype.hoursInDay here")

TemporalText(heap, kind, receiver) == TemporalMethod(heap, kind, "toString", receiver, <<>>, Undefined)
`;
