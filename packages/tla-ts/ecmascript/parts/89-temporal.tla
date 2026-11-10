\* Temporal (Stage 3 proposal), as engine262 implements it: the ISO 8601 calendar only, and the
\* UTC and offset time zones only. Mathematical integers that can pass the 32-bit TLA+ integers
\* (durations, time durations, and epoch nanoseconds) are BigInt records (§6.1.6.2); calendar
\* fields, times of day, and rounding increments are TLA+ integers.
\* A Temporal.Duration has class "temporalDuration" and slots [fields], its ten fields as BigInts.
\* A Temporal.PlainTime has class "temporalTime" and slots [time], a time record.

\* Integer arithmetic on BigInt records.
TI(n) == BigIntFromInt(n)
TIAdd(a, b) == BigIntAdd(a, b)
TISub(a, b) == BigIntSub(a, b)
TIMul(a, b) == BigIntMul(a, b)
TINeg(a) == BigIntNeg(a)
TIAbs(a) == BigIntOf(FALSE, a.mag)
TISign(a) == IF a.mag = <<>> THEN 0 ELSE IF a.neg THEN -1 ELSE 1
TICompare(a, b) == IF a = b THEN 0 ELSE IF BigIntLess(a, b) THEN -1 ELSE 1
\* Floor division and modulo by a positive b.
TIFloorDiv(a, b) ==
  LET q == BigIntDiv(a, b) IN IF a.neg /\ BigIntRem(a, b).mag # <<>> THEN TISub(q, TI(1)) ELSE q
TIMod(a, b) == TISub(a, TIMul(TIFloorDiv(a, b), b))
TIToInt(a) == IF a.neg THEN -BNToInt(a.mag) ELSE BNToInt(a.mag)
\* ℝ(𝔽(a)): a rounded to a Number.
TIFloat(a) == IntegralNumberToBigInt(BigIntToNumber(a))
TIUnits(a) == BigIntToString(a, 10)

TINsPerSecond == TI(1000000000)
TINsPerMinute == TIMul(TI(60), TINsPerSecond)
TINsPerHour == TIMul(TI(3600), TINsPerSecond)
TINsPerDay == TIMul(TI(86400), TINsPerSecond)
\* maxTimeDuration, 2^53 × 10^9 − 1.
TIMaxTimeDuration == TISub(TIMul(BigIntOf(FALSE, BNPow2(53)), TINsPerSecond), TI(1))
IsTimeDuration(d) == ~BigIntLess(TIMaxTimeDuration, TIAbs(d))

\* The Temporal units (Table 21) as 1 (year) to 10 (nanosecond), so a smaller code is a larger
\* unit, with TUAuto for "auto" and TUNoUnit for an absent option.
TUYear == 1
TUMonth == 2
TUWeek == 3
TUDay == 4
TUHour == 5
TUMinute == 6
TUSecond == 7
TUMillisecond == 8
TUMicrosecond == 9
TUNanosecond == 10
TUAuto == 0
TUNoUnit == -1
TemporalUnitNames ==
  <<N("year"), N("month"), N("week"), N("day"), N("hour"), N("minute"), N("second"), N("millisecond"),
    N("microsecond"), N("nanosecond")>>
TemporalUnitPlurals ==
  <<N("years"), N("months"), N("weeks"), N("days"), N("hours"), N("minutes"), N("seconds"), N("milliseconds"),
    N("microseconds"), N("nanoseconds")>>
IsDateUnit(u) == u >= TUYear /\ u <= TUDay
IsTimeUnit(u) == u >= TUHour /\ u <= TUNanosecond
IsCalendarUnit(u) == u >= TUYear /\ u <= TUWeek
LargerOfTwoTemporalUnits(x, y) == IF x < y THEN x ELSE y
\* TemporalUnitLength, in nanoseconds, of a time unit or day.
TemporalUnitLength(u) ==
  CASE u = TUDay -> TINsPerDay
    [] u = TUHour -> TINsPerHour
    [] u = TUMinute -> TINsPerMinute
    [] u = TUSecond -> TINsPerSecond
    [] u = TUMillisecond -> TI(1000000)
    [] u = TUMicrosecond -> TI(1000)
    [] OTHER -> TI(1)
\* MaximumTemporalDurationRoundingIncrement, with 0 for no maximum.
MaximumRoundingIncrement(u) ==
  CASE u = TUHour -> 24
    [] u \in {TUMinute, TUSecond} -> 60
    [] u >= TUMillisecond -> 1000
    [] OTHER -> 0

\* ValidateTemporalUnitValue, as a test: value is absent, one of extra, or a unit of the group.
IsValidUnitValue(value, group, extra) ==
  value = TUNoUnit \/ value \in extra \/
  (IsDateUnit(value) /\ group \in {"date", "datetime"}) \/ (IsTimeUnit(value) /\ group \in {"time", "datetime"})

\* ValidateTemporalRoundingIncrement, as a test, for a BigInt dividend.
IsValidRoundingIncrement(increment, dividend, inclusive) ==
  LET maximum == IF inclusive THEN dividend ELSE TISub(dividend, TI(1)) IN
  ~BigIntLess(maximum, TI(increment)) /\ BigIntRem(dividend, TI(increment)).mag = <<>>

\* GetOptionsObject: undefined gives a new object with a null prototype.
GetOptionsObject(s, options) ==
  CASE options = Undefined -> OrdinaryObjectCreate(s, Null)
    [] IsObject(options) -> Ok(s, options)
    [] OTHER -> ThrowTypeError(s)

\* A string-valued option (GetOption with a list of values): fallback when it is undefined, and
\* otherwise the units of its string, which must be one of allowed.
GetStringOption(s, options, key, allowed, fallback) ==
  LET value == Get(s, options, key) IN IF IsAbrupt(value) THEN value
  ELSE IF Val(value) = Undefined THEN Ok(value.s, fallback)
  ELSE LET str == ToStr(value.s, Val(value)) IN IF IsAbrupt(str) THEN str
  ELSE IF Val(str).value \in allowed THEN Ok(str.s, Val(str).value) ELSE ThrowError(str.s, "RangeError")

\* GetTemporalOverflowOption and GetRoundingModeOption.
GetTemporalOverflowOption(s, options) ==
  GetStringOption(s, options, SV("overflow"), {N("constrain"), N("reject")}, N("constrain"))
RoundingModes ==
  {N("ceil"), N("floor"), N("expand"), N("trunc"), N("halfCeil"), N("halfFloor"), N("halfExpand"),
   N("halfTrunc"), N("halfEven")}
GetRoundingModeOption(s, options, fallback) == GetStringOption(s, options, SV("roundingMode"), RoundingModes, fallback)

\* SnapToInteger with "reject" or, when truncate, "truncate": the BigInt a finite integral Number
\* denotes, or a RangeError.
SnapToInteger(s, v, truncate) ==
  LET n == ToNumber(s, v) IN IF IsAbrupt(n) THEN n ELSE
  LET x == Val(n).value
      t == IF truncate THEN NumToIntegerOrInfinity(x) ELSE x
  IN IF ~NumIsFinite(x) \/ ~NumIsIntegral(t) THEN ThrowError(n.s, "RangeError") ELSE Ok(n.s, IntegralNumberToBigInt(t))

\* SnapToInteger on args[i] to args[n] in turn, with 0 for an undefined one.
SnapArgs(s, args, i, n, truncate, acc) ==
  IF i > n THEN Ok(s, acc)
  ELSE IF Arg(args, i) = Undefined THEN SnapArgs(s, args, i + 1, n, truncate, Append(acc, TI(0)))
  ELSE LET v == SnapToInteger(s, Arg(args, i), truncate) IN IF IsAbrupt(v) THEN v
  ELSE SnapArgs(v.s, args, i + 1, n, truncate, Append(acc, Val(v)))

\* GetRoundingIncrementOption: an integer from 1 to 10^9.
GetRoundingIncrementOption(s, options) ==
  LET value == Get(s, options, SV("roundingIncrement")) IN IF IsAbrupt(value) THEN value
  ELSE IF Val(value) = Undefined THEN Ok(value.s, 1)
  ELSE LET i == SnapToInteger(value.s, Val(value), TRUE) IN IF IsAbrupt(i) THEN i
  ELSE IF BigIntLess(Val(i), TI(1)) \/ BigIntLess(TI(1000000000), Val(i)) THEN ThrowError(i.s, "RangeError")
  ELSE Ok(i.s, TIToInt(Val(i)))

\* GetTemporalUnitValuedOption: a unit code, TUAuto, or TUNoUnit when the option is absent and
\* not required.
GetTemporalUnitValuedOption(s, options, key, required) ==
  LET value == Get(s, options, key) IN IF IsAbrupt(value) THEN value
  ELSE IF Val(value) = Undefined THEN IF required THEN ThrowError(value.s, "RangeError") ELSE Ok(value.s, TUNoUnit)
  ELSE LET str == ToStr(value.s, Val(value)) IN IF IsAbrupt(str) THEN str
  ELSE LET u == Val(str).value
           matches == {i \in 1..10 : TemporalUnitNames[i] = u \/ TemporalUnitPlurals[i] = u}
       IN IF u = N("auto") THEN Ok(str.s, TUAuto)
          ELSE IF matches = {} THEN ThrowError(str.s, "RangeError")
          ELSE Ok(str.s, CHOOSE i \in matches : TRUE)

\* The precisions of time strings: a number of digits, or these.
TPrecisionAuto == -1
TPrecisionMinute == -2

\* GetTemporalFractionalSecondDigitsOption: 0 to 9, or TPrecisionAuto.
GetTemporalFractionalSecondDigitsOption(s, options) ==
  LET value == Get(s, options, SV("fractionalSecondDigits")) IN IF IsAbrupt(value) THEN value
  ELSE IF Val(value) = Undefined THEN Ok(value.s, TPrecisionAuto)
  ELSE IF ~IsNumber(Val(value)) THEN
    LET str == ToStr(value.s, Val(value)) IN IF IsAbrupt(str) THEN str
    ELSE IF Val(str).value = N("auto") THEN Ok(str.s, TPrecisionAuto) ELSE ThrowError(str.s, "RangeError")
  ELSE LET x == Val(value).value IN
       IF ~NumIsFinite(x) THEN ThrowError(value.s, "RangeError")
       ELSE LET digits == MathFloor(x) IN
            IF NumLessThan(digits, NumFromInt(0)) \/ NumLessThan(NumFromInt(9), digits) THEN ThrowError(value.s, "RangeError")
            ELSE Ok(value.s, NumToInt(digits))

\* ToSecondsStringPrecisionRecord, as [precision, unit, increment].
ToSecondsStringPrecisionRecord(smallestUnit, digits) ==
  CASE smallestUnit = TUMinute -> [precision |-> TPrecisionMinute, unit |-> TUMinute, increment |-> 1]
    [] smallestUnit = TUSecond -> [precision |-> 0, unit |-> TUSecond, increment |-> 1]
    [] smallestUnit = TUMillisecond -> [precision |-> 3, unit |-> TUMillisecond, increment |-> 1]
    [] smallestUnit = TUMicrosecond -> [precision |-> 6, unit |-> TUMicrosecond, increment |-> 1]
    [] smallestUnit = TUNanosecond -> [precision |-> 9, unit |-> TUNanosecond, increment |-> 1]
    [] digits = TPrecisionAuto -> [precision |-> TPrecisionAuto, unit |-> TUNanosecond, increment |-> 1]
    [] digits = 0 -> [precision |-> 0, unit |-> TUSecond, increment |-> 1]
    [] digits <= 3 -> [precision |-> digits, unit |-> TUMillisecond, increment |-> 10 ^ (3 - digits)]
    [] digits <= 6 -> [precision |-> digits, unit |-> TUMicrosecond, increment |-> 10 ^ (6 - digits)]
    [] OTHER -> [precision |-> digits, unit |-> TUNanosecond, increment |-> 10 ^ (9 - digits)]

\* NegateRoundingMode and GetUnsignedRoundingMode.
NegateRoundingMode(mode) ==
  CASE mode = N("ceil") -> N("floor")
    [] mode = N("floor") -> N("ceil")
    [] mode = N("halfCeil") -> N("halfFloor")
    [] mode = N("halfFloor") -> N("halfCeil")
    [] OTHER -> mode
UnsignedRoundingMode(mode, negative) ==
  CASE mode = N("ceil") -> IF negative THEN "zero" ELSE "infinity"
    [] mode = N("floor") -> IF negative THEN "infinity" ELSE "zero"
    [] mode = N("expand") -> "infinity"
    [] mode = N("trunc") -> "zero"
    [] mode = N("halfCeil") -> IF negative THEN "half-zero" ELSE "half-infinity"
    [] mode = N("halfFloor") -> IF negative THEN "half-infinity" ELSE "half-zero"
    [] mode = N("halfExpand") -> "half-infinity"
    [] mode = N("halfTrunc") -> "half-zero"
    [] OTHER -> "half-even"

\* n / d rounded to an integer by a rounding mode, for BigInts n and d > 0: the quotient step of
\* RoundNumberToIncrement with ApplyUnsignedRoundingMode, exactly.
RoundQuotient(n, d, mode) ==
  LET lower == BigIntDiv(TIAbs(n), d)
      remainder == BigIntRem(TIAbs(n), d)
      upper == TIAdd(lower, TI(1))
      unsigned == UnsignedRoundingMode(mode, n.neg)
      half == TICompare(TIMul(remainder, TI(2)), d)
      rounded == CASE remainder.mag = <<>> -> lower
                   [] unsigned = "zero" -> lower
                   [] unsigned = "infinity" -> upper
                   [] half < 0 -> lower
                   [] half > 0 -> upper
                   [] unsigned = "half-zero" -> lower
                   [] unsigned = "half-infinity" -> upper
                   [] BNIsOdd(lower.mag) -> upper
                   [] OTHER -> lower
  IN IF n.neg THEN TINeg(rounded) ELSE rounded
\* RoundNumberToIncrement of the rational n / d, for an integer increment.
RoundRatioToIncrement(n, d, increment, mode) == TIMul(RoundQuotient(n, TIMul(d, TI(increment)), mode), TI(increment))
\* The Number nearest the rational n / d, for d > 0.
RatioToNumber(n, d) == IF n.mag = <<>> THEN PosZero ELSE RoundRatio(n.neg, n.mag, d.mag, 0)

\* Time records: [hour, minute, second, millisecond, microsecond, nanosecond] of TLA+ integers.
\* Operations that can overflow a day give [days, time], with days a BigInt.
MidnightTimeRecord == [hour |-> 0, minute |-> 0, second |-> 0, millisecond |-> 0, microsecond |-> 0, nanosecond |-> 0]
NoonTimeRecord == [MidnightTimeRecord EXCEPT !.hour = 12]
TimeFields(t) == <<t.hour, t.minute, t.second, t.millisecond, t.microsecond, t.nanosecond>>
TimeFromFields(f) ==
  [hour |-> f[1], minute |-> f[2], second |-> f[3], millisecond |-> f[4], microsecond |-> f[5], nanosecond |-> f[6]]
TimeLimits == <<23, 59, 59, 999, 999, 999>>
SubSecondNanoseconds(t) == t.millisecond * 1000000 + t.microsecond * 1000 + t.nanosecond
\* The nanoseconds since midnight of a time record.
TimeNanoseconds(t) ==
  TIAdd(TIMul(TI((t.hour * 60 + t.minute) * 60 + t.second), TINsPerSecond), TI(SubSecondNanoseconds(t)))

\* BalanceTime of a number of nanoseconds since midnight, as [days, time].
BalanceTime(ns) ==
  LET rest == TIMod(ns, TINsPerDay)
      seconds == TIToInt(BigIntDiv(rest, TINsPerSecond))
      sub == TIToInt(BigIntRem(rest, TINsPerSecond))
  IN [days |-> TIFloorDiv(ns, TINsPerDay),
      time |-> [hour |-> seconds \div 3600, minute |-> (seconds \div 60) % 60, second |-> seconds % 60,
                millisecond |-> sub \div 1000000, microsecond |-> (sub \div 1000) % 1000, nanosecond |-> sub % 1000]]

\* RegulateTime for BigInt fields: "constrain" clamps them, and "reject" throws a RangeError for one
\* out of range, as CreateTimeRecord does.
IsValidTimeFields(f) == \A i \in 1..6 : ~f[i].neg /\ ~BigIntLess(TI(TimeLimits[i]), f[i])
RegulateTime(s, f, overflow) ==
  IF overflow = N("reject") /\ ~IsValidTimeFields(f) THEN ThrowError(s, "RangeError")
  ELSE Ok(s, TimeFromFields([i \in 1..6 |-> CASE f[i].neg -> 0
                                               [] BigIntLess(TI(TimeLimits[i]), f[i]) -> TimeLimits[i]
                                               [] OTHER -> TIToInt(f[i])]))

\* Compares integer sequences of equal length lexicographically.
CompareFieldsFrom(x, y, i) ==
  CASE i > Len(x) -> 0
    [] x[i] > y[i] -> 1
    [] x[i] < y[i] -> -1
    [] OTHER -> CompareFieldsFrom(x, y, i + 1)
CompareTimeRecord(x, y) == CompareFieldsFrom(TimeFields(x), TimeFields(y), 1)

\* DifferenceTime and AddTime.
DifferenceTime(from, to) == TISub(TimeNanoseconds(to), TimeNanoseconds(from))
AddTime(t, timeDuration) == BalanceTime(TIAdd(TimeNanoseconds(t), timeDuration))

\* RoundTime, as [days, time]. The quantity is the time's parts from unit down, which for a
\* balanced time is its nanoseconds modulo the next larger unit.
RoundTime(t, increment, unit, mode) ==
  LET total == TimeNanoseconds(t)
      quantity == IF unit <= TUHour THEN total ELSE TIMod(total, TemporalUnitLength(unit - 1))
  IN BalanceTime(TIAdd(TISub(total, quantity),
                      TIMul(RoundRatioToIncrement(quantity, TemporalUnitLength(unit), increment, mode), TemporalUnitLength(unit))))
\* RoundNumberToIncrement of an integer quantity.
RoundNumberToIncrement(quantity, increment, mode) == TIMul(RoundQuotient(quantity, increment, mode), increment)

\* FormatFractionalSeconds and FormatTimeString.
TrailingZerosStart(units, i) == IF i > 0 /\ units[i] = 48 THEN TrailingZerosStart(units, i - 1) ELSE i
FormatFractionalSeconds(sub, precision) ==
  LET digits == PadStart(IntUnits(sub), 9) IN
  CASE precision = TPrecisionAuto -> IF sub = 0 THEN <<>> ELSE <<46>> \o SubSeq(digits, 1, TrailingZerosStart(digits, 9))
    [] precision = 0 -> <<>>
    [] OTHER -> <<46>> \o SubSeq(digits, 1, precision)
FormatTimeString(hour, minute, second, sub, precision, separated) ==
  LET separator == IF separated THEN <<58>> ELSE <<>> IN
  TwoDigits(hour) \o separator \o TwoDigits(minute) \o
  (IF precision = TPrecisionMinute THEN <<>> ELSE separator \o TwoDigits(second) \o FormatFractionalSeconds(sub, precision))
TimeRecordToString(t, precision) ==
  FormatTimeString(t.hour, t.minute, t.second, SubSecondNanoseconds(t), precision, TRUE)

\* IsPartialTemporalObject.
TemporalClasses ==
  {"temporalDate", "temporalDateTime", "temporalMonthDay", "temporalTime", "temporalYearMonth", "temporalZonedDateTime"}
IsPartialTemporalObject(s, v) ==
  IF ~IsObject(v) \/ O(s, v).class \in TemporalClasses THEN Ok(s, FALSE)
  ELSE LET calendar == Get(s, v, SV("calendar")) IN IF IsAbrupt(calendar) THEN calendar
  ELSE IF Val(calendar) # Undefined THEN Ok(calendar.s, FALSE)
  ELSE LET timeZone == Get(calendar.s, v, SV("timeZone")) IN IF IsAbrupt(timeZone) THEN timeZone
  ELSE Ok(timeZone.s, Val(timeZone) = Undefined)

\* An options argument that may be a string: a new object with a null prototype whose key is the
\* string, or GetOptionsObject (Temporal.Duration.prototype.round step 4 and its kin).
StringOrOptionsObject(s, options, key) ==
  IF options = Undefined THEN ThrowTypeError(s)
  ELSE IF IsString(options) THEN
    LET o == OrdinaryObjectCreate(s, Null) IN
    LET r == CreateDataPropertyOrThrow(o.s, Val(o), key, options) IN Ok(r.s, Val(o))
  ELSE GetOptionsObject(s, options)

\* GetDifferenceSettings, as [smallestUnit, largestUnit, roundingMode, roundingIncrement].
GetDifferenceSettings(s, operation, options, group, disallowed, fallbackSmallestUnit, smallestLargestDefaultUnit) ==
  LET largestOption == GetTemporalUnitValuedOption(s, options, SV("largestUnit"), FALSE) IN
  IF IsAbrupt(largestOption) THEN largestOption ELSE
  LET increment == GetRoundingIncrementOption(largestOption.s, options) IN IF IsAbrupt(increment) THEN increment ELSE
  LET mode == GetRoundingModeOption(increment.s, options, N("trunc")) IN IF IsAbrupt(mode) THEN mode ELSE
  LET smallestOption == GetTemporalUnitValuedOption(mode.s, options, SV("smallestUnit"), FALSE) IN
  IF IsAbrupt(smallestOption) THEN smallestOption ELSE
  LET s1 == smallestOption.s
      largest0 == IF Val(largestOption) = TUNoUnit THEN TUAuto ELSE Val(largestOption)
      smallest == IF Val(smallestOption) = TUNoUnit THEN fallbackSmallestUnit ELSE Val(smallestOption)
      largest == IF largest0 = TUAuto THEN LargerOfTwoTemporalUnits(smallestLargestDefaultUnit, smallest) ELSE largest0
      maximum == MaximumRoundingIncrement(smallest)
  IN IF ~IsValidUnitValue(Val(largestOption), group, {TUAuto}) \/ largest0 \in disallowed \/
        ~IsValidUnitValue(Val(smallestOption), group, {}) \/ smallest \in disallowed \/
        LargerOfTwoTemporalUnits(largest, smallest) # largest \/
        (maximum # 0 /\ ~IsValidRoundingIncrement(Val(increment), TI(maximum), FALSE))
     THEN ThrowError(s1, "RangeError")
     ELSE Ok(s1, [smallestUnit |-> smallest, largestUnit |-> largest, roundingIncrement |-> Val(increment),
                  roundingMode |-> IF operation = "since" THEN NegateRoundingMode(Val(mode)) ELSE Val(mode)])

\* Durations (Temporal §7). Their fields are years, months, weeks, days, hours, minutes, seconds,
\* milliseconds, microseconds, and nanoseconds, in that order.
DurationFieldKeys ==
  <<SV("years"), SV("months"), SV("weeks"), SV("days"), SV("hours"), SV("minutes"), SV("seconds"),
    SV("milliseconds"), SV("microseconds"), SV("nanoseconds")>>
ZeroDurationFields == [i \in 1..10 |-> TI(0)]
DurationFieldsOf(s, v) == O(s, v).slots.fields

\* DurationSign and DefaultTemporalLargestUnit.
FirstNonzeroFrom(f, i) == IF i > Len(f) \/ f[i].mag # <<>> THEN i ELSE FirstNonzeroFrom(f, i + 1)
DurationSign(f) == LET i == FirstNonzeroFrom(f, 1) IN IF i > Len(f) THEN 0 ELSE TISign(f[i])
DefaultTemporalLargestUnit(f) == LET i == FirstNonzeroFrom(f, 1) IN IF i > 10 THEN TUNanosecond ELSE i

\* TimeDurationFromComponents, without its range check.
TimeDurationOf(hours, minutes, seconds, ms, us, ns) ==
  TIAdd(TIAdd(TIMul(TIAdd(TIMul(TIAdd(TIMul(hours, TI(60)), minutes), TI(60)), seconds), TINsPerSecond),
              TIMul(ms, TI(1000000))),
        TIAdd(TIMul(us, TI(1000)), ns))

\* IsValidDuration.
TwoPow32 == BigIntOf(FALSE, BNPow2(32))
IsValidDuration(f) ==
  LET signs == {TISign(f[i]) : i \in 1..10} IN
  ~({-1, 1} \subseteq signs) /\ \A i \in 1..3 : BigIntLess(TIAbs(f[i]), TwoPow32) /\
  IsTimeDuration(TIAdd(TIMul(f[4], TINsPerDay),
                       TimeDurationOf(f[5], f[6], f[7], TIFloat(f[8]), TIFloat(f[9]), TIFloat(f[10]))))

\* CreateTemporalDuration, with Empty for no newTarget.
CreateTemporalDuration(s, f, newTarget) ==
  IF ~IsValidDuration(f) THEN ThrowError(s, "RangeError")
  ELSE OrdinaryCreateFromConstructor(s, IF newTarget = Empty THEN Intrinsic(s, "TemporalDuration") ELSE newTarget,
                                     "TemporalDurationPrototype", "temporalDuration",
                                     [fields |-> [i \in 1..10 |-> TIFloat(f[i])]])
NegatedDurationFields(f) == [i \in 1..10 |-> TINeg(f[i])]

\* Internal duration records [date, time]: the first four fields, and a time duration.
ToInternalDurationRecord(f) == [date |-> SubSeq(f, 1, 4), time |-> TimeDurationOf(f[5], f[6], f[7], f[8], f[9], f[10])]
ToInternalDurationRecordWith24HourDays(f) ==
  [date |-> <<f[1], f[2], f[3], TI(0)>>,
   time |-> TIAdd(TimeDurationOf(f[5], f[6], f[7], f[8], f[9], f[10]), TIMul(f[4], TINsPerDay))]
ZeroDateDuration == <<TI(0), TI(0), TI(0), TI(0)>>
CombineDateAndTimeDuration(date, time) == [date |-> date, time |-> time]
IsValidDateDuration(date) == IsValidDuration(date \o <<TI(0), TI(0), TI(0), TI(0), TI(0), TI(0)>>)

\* The fields TemporalDurationFromInternal gives: the time duration spread over largestUnit (day
\* for a date unit) and the smaller units.
DurationFieldsFromInternal(internal, largestUnit) ==
  LET sign == TI(TISign(internal.time))
      ns == TIAbs(internal.time)
      first == IF largestUnit <= TUDay THEN TUDay ELSE largestUnit
      part(u) == CASE u < first -> TI(0)
                   [] u = first -> BigIntDiv(ns, TemporalUnitLength(u))
                   [] OTHER -> BigIntDiv(TIMod(ns, TemporalUnitLength(u - 1)), TemporalUnitLength(u))
  IN <<internal.date[1], internal.date[2], internal.date[3], TIAdd(internal.date[4], TIMul(part(TUDay), sign))>> \o
     [i \in 1..6 |-> TIMul(part(TUDay + i), sign)]
TemporalDurationFromInternal(s, internal, largestUnit) ==
  CreateTemporalDuration(s, DurationFieldsFromInternal(internal, largestUnit), Empty)

\* RoundTimeDurationToIncrement and RoundTimeDuration.
RoundTimeDurationToIncrement(s, d, increment, mode) ==
  LET rounded == RoundNumberToIncrement(d, increment, mode) IN
  IF IsTimeDuration(rounded) THEN Ok(s, rounded) ELSE ThrowError(s, "RangeError")
RoundTimeDuration(s, d, increment, unit, mode) ==
  RoundTimeDurationToIncrement(s, d, TIMul(TemporalUnitLength(unit), TI(increment)), mode)

\* ToPartialDurationRecord: the fields, with Empty for an undefined one, read in alphabetical order.
DurationFieldOrder == <<4, 5, 9, 8, 6, 2, 10, 7, 3, 1>>
PartialDurationFrom(s, item, order, acc) ==
  IF order = <<>> THEN IF \A i \in 1..10 : acc[i] = Empty THEN ThrowTypeError(s) ELSE Ok(s, acc)
  ELSE LET i == Head(order)
           v == Get(s, item, DurationFieldKeys[i])
       IN IF IsAbrupt(v) THEN v
          ELSE IF Val(v) = Undefined THEN PartialDurationFrom(v.s, item, Tail(order), acc)
          ELSE LET n == SnapToInteger(v.s, Val(v), FALSE) IN IF IsAbrupt(n) THEN n
          ELSE PartialDurationFrom(n.s, item, Tail(order), [acc EXCEPT ![i] = Val(n)])
ToPartialDurationRecord(s, item) ==
  IF ~IsObject(item) THEN ThrowTypeError(s) ELSE PartialDurationFrom(s, item, DurationFieldOrder, [i \in 1..10 |-> Empty])

\* ToTemporalDuration, as the fields of the duration, checked as CreateTemporalDuration does.
ToTemporalDurationFields(s, item) ==
  LET f == IF IsObject(item) /\ O(s, item).class = "temporalDuration" THEN Ok(s, DurationFieldsOf(s, item))
           ELSE IF IsString(item) THEN ParseTemporalDurationString(s, item.value)
           ELSE IF ~IsObject(item) THEN ThrowTypeError(s)
           ELSE LET partial == ToPartialDurationRecord(s, item) IN IF IsAbrupt(partial) THEN partial
                ELSE Ok(partial.s, [i \in 1..10 |-> IF Val(partial)[i] = Empty THEN TI(0) ELSE Val(partial)[i]])
  IN IF IsAbrupt(f) THEN f ELSE IF IsValidDuration(Val(f)) THEN Ok(f.s, [i \in 1..10 |-> TIFloat(Val(f)[i])])
     ELSE ThrowError(f.s, "RangeError")

\* TemporalDurationToString.
DurationDesignators == <<89, 77, 87, 68, 72, 77>>
DurationPart(f, i) == IF f[i].mag = <<>> THEN <<>> ELSE TIUnits(TIAbs(f[i])) \o <<DurationDesignators[i]>>
TemporalDurationToString(f, precision) ==
  LET datePart == DurationPart(f, 1) \o DurationPart(f, 2) \o DurationPart(f, 3) \o DurationPart(f, 4)
      secondsDuration == TimeDurationOf(TI(0), TI(0), f[7], f[8], f[9], f[10])
      timePart == DurationPart(f, 5) \o DurationPart(f, 6) \o
                  (IF secondsDuration.mag # <<>> \/ DefaultTemporalLargestUnit(f) >= TUSecond \/ precision # TPrecisionAuto
                   THEN TIUnits(BigIntDiv(TIAbs(secondsDuration), TINsPerSecond)) \o
                        FormatFractionalSeconds(TIToInt(BigIntRem(TIAbs(secondsDuration), TINsPerSecond)), precision) \o <<83>>
                   ELSE <<>>)
  IN (IF DurationSign(f) < 0 THEN <<45>> ELSE <<>>) \o <<80>> \o datePart \o
     (IF timePart = <<>> THEN <<>> ELSE <<84>> \o timePart)

\* AddDurations, as the fields of the sum.
AddDurations(s, operation, f, other) ==
  LET o == ToTemporalDurationFields(s, other) IN IF IsAbrupt(o) THEN o ELSE
  LET y == IF operation = "subtract" THEN NegatedDurationFields(Val(o)) ELSE Val(o)
      largest == LargerOfTwoTemporalUnits(DefaultTemporalLargestUnit(f), DefaultTemporalLargestUnit(y))
      time == TIAdd(ToInternalDurationRecordWith24HourDays(f).time, ToInternalDurationRecordWith24HourDays(y).time)
  IN IF IsCalendarUnit(largest) \/ ~IsTimeDuration(time) THEN ThrowError(o.s, "RangeError")
     ELSE TemporalDurationFromInternal(o.s, CombineDateAndTimeDuration(ZeroDateDuration, time), largest)

\* PlainTime (Temporal §4).
CreateTemporalTime(s, t, newTarget) ==
  OrdinaryCreateFromConstructor(s, IF newTarget = Empty THEN Intrinsic(s, "TemporalPlainTime") ELSE newTarget,
                                "TemporalPlainTimePrototype", "temporalTime", [time |-> t])

\* ToPartialTimeRecord: hour, minute, second, millisecond, microsecond, and nanosecond as BigInts,
\* read in alphabetical order, with 0 (when complete) or Empty for an undefined one.
TimeFieldKeys ==
  <<SV("hour"), SV("minute"), SV("second"), SV("millisecond"), SV("microsecond"), SV("nanosecond")>>
PartialTimeFrom(s, item, order, acc, isAny) ==
  IF order = <<>> THEN IF isAny THEN Ok(s, acc) ELSE ThrowTypeError(s)
  ELSE LET i == Head(order)
           v == Get(s, item, TimeFieldKeys[i])
       IN IF IsAbrupt(v) THEN v
          ELSE IF Val(v) = Undefined THEN PartialTimeFrom(v.s, item, Tail(order), acc, isAny)
          ELSE LET n == SnapToInteger(v.s, Val(v), TRUE) IN IF IsAbrupt(n) THEN n
          ELSE PartialTimeFrom(n.s, item, Tail(order), [acc EXCEPT ![i] = Val(n)], TRUE)
ToPartialTimeRecord(s, item, complete) ==
  PartialTimeFrom(s, item, <<1, 5, 4, 2, 6, 3>>, [i \in 1..6 |-> IF complete THEN TI(0) ELSE Empty], FALSE)

\* The time of day of a Temporal object that has one.
TemporalTimeOfObject(s, v) ==
  LET o == O(s, v) IN
  CASE o.class = "temporalTime" -> o.slots.time
    [] o.class = "temporalDateTime" -> o.slots.dateTime.time
    [] o.class = "temporalZonedDateTime" -> ZonedDateTimeISODateTime(s, v).time

\* ToTemporalTime, as the time record.
ToTemporalTimeRecord(s, item, options) ==
  IF IsObject(item) THEN
    IF O(s, item).class \in {"temporalTime", "temporalDateTime", "temporalZonedDateTime"} THEN
      LET opts == GetOptionsObject(s, options) IN IF IsAbrupt(opts) THEN opts ELSE
      LET overflow == GetTemporalOverflowOption(opts.s, Val(opts)) IN IF IsAbrupt(overflow) THEN overflow
      ELSE Ok(overflow.s, TemporalTimeOfObject(s, item))
    ELSE LET partial == ToPartialTimeRecord(s, item, TRUE) IN IF IsAbrupt(partial) THEN partial ELSE
         LET opts == GetOptionsObject(partial.s, options) IN IF IsAbrupt(opts) THEN opts ELSE
         LET overflow == GetTemporalOverflowOption(opts.s, Val(opts)) IN IF IsAbrupt(overflow) THEN overflow
         ELSE RegulateTime(overflow.s, Val(partial), Val(overflow))
  ELSE IF ~IsString(item) THEN ThrowTypeError(s)
  ELSE LET parsed == ParseISODateTime(s, item.value, "time") IN IF IsAbrupt(parsed) THEN parsed ELSE
       LET opts == GetOptionsObject(parsed.s, options) IN IF IsAbrupt(opts) THEN opts ELSE
       LET overflow == GetTemporalOverflowOption(opts.s, Val(opts)) IN IF IsAbrupt(overflow) THEN overflow
       ELSE Ok(overflow.s, Val(parsed).time)

\* DifferenceTemporalPlainTime.
DifferenceTemporalPlainTime(s, operation, t, other, options) ==
  LET o == ToTemporalTimeRecord(s, other, Undefined) IN IF IsAbrupt(o) THEN o ELSE
  LET opts == GetOptionsObject(o.s, options) IN IF IsAbrupt(opts) THEN opts ELSE
  LET settings == GetDifferenceSettings(opts.s, operation, Val(opts), "time", {}, TUNanosecond, TUHour) IN
  IF IsAbrupt(settings) THEN settings ELSE
  LET st == Val(settings)
      rounded == RoundTimeDuration(settings.s, DifferenceTime(t, Val(o)), st.roundingIncrement, st.smallestUnit, st.roundingMode)
      f == DurationFieldsFromInternal(CombineDateAndTimeDuration(ZeroDateDuration, Val(rounded)), st.largestUnit)
  IN CreateTemporalDuration(rounded.s, IF operation = "since" THEN NegatedDurationFields(f) ELSE f, Empty)

PlainTimeBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" ->
         IF nt = Undefined THEN ThrowTypeError(s)
         ELSE LET fields == SnapArgs(s, args, 1, 6, TRUE, <<>>) IN IF IsAbrupt(fields) THEN fields ELSE
              LET t == RegulateTime(fields.s, Val(fields), N("reject")) IN IF IsAbrupt(t) THEN t
              ELSE CreateTemporalTime(t.s, Val(t), nt)
    [] m = "from" ->
         LET t == ToTemporalTimeRecord(s, Arg(args, 1), Arg(args, 2)) IN
         IF IsAbrupt(t) THEN t ELSE CreateTemporalTime(t.s, Val(t), Empty)
    [] m = "compare" ->
         LET x == ToTemporalTimeRecord(s, Arg(args, 1), Undefined) IN IF IsAbrupt(x) THEN x ELSE
         LET y == ToTemporalTimeRecord(x.s, Arg(args, 2), Undefined) IN IF IsAbrupt(y) THEN y
         ELSE Ok(y.s, IntV(CompareTimeRecord(Val(x), Val(y))))
    [] ~HasClass(s, this, "temporalTime") -> ThrowTypeError(s)
    [] OTHER ->
         LET t == O(s, this).slots.time IN
         CASE m = "hour" -> Ok(s, IntV(t.hour))
           [] m = "minute" -> Ok(s, IntV(t.minute))
           [] m = "second" -> Ok(s, IntV(t.second))
           [] m = "millisecond" -> Ok(s, IntV(t.millisecond))
           [] m = "microsecond" -> Ok(s, IntV(t.microsecond))
           [] m = "nanosecond" -> Ok(s, IntV(t.nanosecond))
           [] m \in {"add", "subtract"} ->
                LET d == ToTemporalDurationFields(s, Arg(args, 1)) IN IF IsAbrupt(d) THEN d ELSE
                LET duration == IF m = "subtract" THEN NegatedDurationFields(Val(d)) ELSE Val(d) IN
                CreateTemporalTime(d.s, AddTime(t, ToInternalDurationRecord(duration).time).time, Empty)
           [] m = "with" ->
                LET isPartial == IsPartialTemporalObject(s, Arg(args, 1)) IN IF IsAbrupt(isPartial) THEN isPartial
                ELSE IF ~Val(isPartial) THEN ThrowTypeError(isPartial.s) ELSE
                LET partial == ToPartialTimeRecord(isPartial.s, Arg(args, 1), FALSE) IN IF IsAbrupt(partial) THEN partial ELSE
                LET opts == GetOptionsObject(partial.s, Arg(args, 2)) IN IF IsAbrupt(opts) THEN opts ELSE
                LET overflow == GetTemporalOverflowOption(opts.s, Val(opts)) IN IF IsAbrupt(overflow) THEN overflow ELSE
                LET fields == [i \in 1..6 |-> IF Val(partial)[i] = Empty THEN TI(TimeFields(t)[i]) ELSE Val(partial)[i]]
                    r == RegulateTime(overflow.s, fields, Val(overflow))
                IN IF IsAbrupt(r) THEN r ELSE CreateTemporalTime(r.s, Val(r), Empty)
           [] m \in {"until", "since"} -> DifferenceTemporalPlainTime(s, m, t, Arg(args, 1), Arg(args, 2))
           [] m = "round" ->
                LET roundTo == StringOrOptionsObject(s, Arg(args, 1), SV("smallestUnit")) IN IF IsAbrupt(roundTo) THEN roundTo ELSE
                LET increment == GetRoundingIncrementOption(roundTo.s, Val(roundTo)) IN IF IsAbrupt(increment) THEN increment ELSE
                LET mode == GetRoundingModeOption(increment.s, Val(roundTo), N("halfExpand")) IN IF IsAbrupt(mode) THEN mode ELSE
                LET unit == GetTemporalUnitValuedOption(mode.s, Val(roundTo), SV("smallestUnit"), TRUE) IN IF IsAbrupt(unit) THEN unit
                ELSE IF ~IsValidUnitValue(Val(unit), "time", {}) \/
                        ~IsValidRoundingIncrement(Val(increment), TI(MaximumRoundingIncrement(Val(unit))), FALSE)
                THEN ThrowError(unit.s, "RangeError")
                ELSE CreateTemporalTime(unit.s, RoundTime(t, Val(increment), Val(unit), Val(mode)).time, Empty)
           [] m = "equals" ->
                LET other == ToTemporalTimeRecord(s, Arg(args, 1), Undefined) IN IF IsAbrupt(other) THEN other
                ELSE Ok(other.s, Bool(CompareTimeRecord(t, Val(other)) = 0))
           [] m = "toString" ->
                LET opts == GetOptionsObject(s, Arg(args, 1)) IN IF IsAbrupt(opts) THEN opts ELSE
                LET digits == GetTemporalFractionalSecondDigitsOption(opts.s, Val(opts)) IN IF IsAbrupt(digits) THEN digits ELSE
                LET mode == GetRoundingModeOption(digits.s, Val(opts), N("trunc")) IN IF IsAbrupt(mode) THEN mode ELSE
                LET unit == GetTemporalUnitValuedOption(mode.s, Val(opts), SV("smallestUnit"), FALSE) IN IF IsAbrupt(unit) THEN unit
                ELSE IF ~IsValidUnitValue(Val(unit), "time", {}) \/ Val(unit) = TUHour THEN ThrowError(unit.s, "RangeError")
                ELSE LET precision == ToSecondsStringPrecisionRecord(Val(unit), Val(digits)) IN
                     Ok(unit.s, Str(TimeRecordToString(RoundTime(t, precision.increment, precision.unit, Val(mode)).time,
                                                       precision.precision)))
           [] m \in {"toLocaleString", "toJSON"} -> Ok(s, Str(TimeRecordToString(t, TPrecisionAuto)))
           [] m = "valueOf" -> ThrowTypeError(s)

\* The relativeTo option of Temporal.Duration's round, total, and compare, as [plain, zoned]:
\* a PlainDate or a ZonedDateTime object, or Empty.
NoRelativeTo == [plain |-> Empty, zoned |-> Empty]

DurationBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" ->
         IF nt = Undefined THEN ThrowTypeError(s)
         ELSE LET fields == SnapArgs(s, args, 1, 10, FALSE, <<>>) IN
              IF IsAbrupt(fields) THEN fields ELSE CreateTemporalDuration(fields.s, Val(fields), nt)
    [] m = "from" ->
         LET d == ToTemporalDurationFields(s, Arg(args, 1)) IN IF IsAbrupt(d) THEN d ELSE CreateTemporalDuration(d.s, Val(d), Empty)
    [] m = "compare" ->
         LET x == ToTemporalDurationFields(s, Arg(args, 1)) IN IF IsAbrupt(x) THEN x ELSE
         LET y == ToTemporalDurationFields(x.s, Arg(args, 2)) IN IF IsAbrupt(y) THEN y ELSE
         LET opts == GetOptionsObject(y.s, Arg(args, 3)) IN IF IsAbrupt(opts) THEN opts ELSE
         LET relativeTo == GetTemporalRelativeToOption(opts.s, Val(opts)) IN IF IsAbrupt(relativeTo) THEN relativeTo
         ELSE IF Val(x) = Val(y) THEN Ok(relativeTo.s, IntV(0))
         ELSE CompareDurations(relativeTo.s, Val(x), Val(y), Val(relativeTo))
    [] ~HasClass(s, this, "temporalDuration") -> ThrowTypeError(s)
    [] OTHER ->
         LET d == DurationFieldsOf(s, this)
             fieldIndex == CASE m = "years" -> 1 [] m = "months" -> 2 [] m = "weeks" -> 3 [] m = "days" -> 4
                             [] m = "hours" -> 5 [] m = "minutes" -> 6 [] m = "seconds" -> 7 [] m = "milliseconds" -> 8
                             [] m = "microseconds" -> 9 [] m = "nanoseconds" -> 10 [] OTHER -> 0
         IN CASE fieldIndex # 0 -> Ok(s, Num(BigIntToNumber(d[fieldIndex])))
              [] m = "sign" -> Ok(s, IntV(DurationSign(d)))
              [] m = "blank" -> Ok(s, Bool(DurationSign(d) = 0))
              [] m = "with" ->
                   LET partial == ToPartialDurationRecord(s, Arg(args, 1)) IN IF IsAbrupt(partial) THEN partial
                   ELSE CreateTemporalDuration(partial.s, [i \in 1..10 |-> IF Val(partial)[i] = Empty THEN d[i] ELSE Val(partial)[i]], Empty)
              [] m = "negated" -> CreateTemporalDuration(s, NegatedDurationFields(d), Empty)
              [] m = "abs" -> CreateTemporalDuration(s, [i \in 1..10 |-> TIAbs(d[i])], Empty)
              [] m \in {"add", "subtract"} -> AddDurations(s, m, d, Arg(args, 1))
              [] m = "round" -> DurationRound(s, d, Arg(args, 1))
              [] m = "total" -> DurationTotal(s, d, Arg(args, 1))
              [] m = "toString" ->
                   LET opts == GetOptionsObject(s, Arg(args, 1)) IN IF IsAbrupt(opts) THEN opts ELSE
                   LET digits == GetTemporalFractionalSecondDigitsOption(opts.s, Val(opts)) IN IF IsAbrupt(digits) THEN digits ELSE
                   LET mode == GetRoundingModeOption(digits.s, Val(opts), N("trunc")) IN IF IsAbrupt(mode) THEN mode ELSE
                   LET unit == GetTemporalUnitValuedOption(mode.s, Val(opts), SV("smallestUnit"), FALSE) IN IF IsAbrupt(unit) THEN unit
                   ELSE IF ~IsValidUnitValue(Val(unit), "time", {}) \/ Val(unit) \in {TUHour, TUMinute} THEN ThrowError(unit.s, "RangeError")
                   ELSE LET precision == ToSecondsStringPrecisionRecord(Val(unit), Val(digits)) IN
                        IF precision.unit = TUNanosecond /\ precision.increment = 1 THEN Ok(unit.s, Str(TemporalDurationToString(d, precision.precision)))
                        ELSE LET internal == ToInternalDurationRecord(d)
                                 time == RoundTimeDuration(unit.s, internal.time, precision.increment, precision.unit, Val(mode))
                             IN IF IsAbrupt(time) THEN time ELSE
                             LET rounded == DurationFieldsFromInternal(CombineDateAndTimeDuration(internal.date, Val(time)),
                                                                       LargerOfTwoTemporalUnits(DefaultTemporalLargestUnit(d), TUSecond))
                             IN IF ~IsValidDuration(rounded) THEN ThrowError(time.s, "RangeError")
                                ELSE Ok(time.s, Str(TemporalDurationToString([i \in 1..10 |-> TIFloat(rounded[i])], precision.precision)))
              [] m \in {"toJSON", "toLocaleString"} -> Ok(s, Str(TemporalDurationToString(d, TPrecisionAuto)))
              [] m = "valueOf" -> ThrowTypeError(s)

\* Temporal.Duration.compare after its fields differ (steps 6 to 13).
CompareDurations(s, x, y, relativeTo) ==
  LET xLargest == DefaultTemporalLargestUnit(x)
      yLargest == DefaultTemporalLargestUnit(y)
      xInternal == ToInternalDurationRecord(x)
      yInternal == ToInternalDurationRecord(y)
  IN IF relativeTo.zoned # Empty /\ (IsDateUnit(xLargest) \/ IsDateUnit(yLargest)) THEN
       LET z == relativeTo.zoned
           xAfter == AddZonedDateTime(s, z.epochNs, z.timeZone, xInternal, N("constrain")) IN
       IF IsAbrupt(xAfter) THEN xAfter ELSE
       LET yAfter == AddZonedDateTime(xAfter.s, z.epochNs, z.timeZone, yInternal, N("constrain")) IN
       IF IsAbrupt(yAfter) THEN yAfter ELSE Ok(yAfter.s, IntV(TICompare(Val(xAfter), Val(yAfter))))
     ELSE LET isCalendar == IsCalendarUnit(xLargest) \/ IsCalendarUnit(yLargest) IN
       IF isCalendar /\ relativeTo.plain = Empty THEN ThrowError(s, "RangeError") ELSE
       LET xDays == IF isCalendar THEN DateDurationDays(s, xInternal.date, relativeTo.plain) ELSE Ok(s, x[4]) IN
       IF IsAbrupt(xDays) THEN xDays ELSE
       LET yDays == IF isCalendar THEN DateDurationDays(xDays.s, yInternal.date, relativeTo.plain) ELSE Ok(xDays.s, y[4]) IN
       IF IsAbrupt(yDays) THEN yDays ELSE
       LET xTime == TIAdd(xInternal.time, TIMul(Val(xDays), TINsPerDay))
           yTime == TIAdd(yInternal.time, TIMul(Val(yDays), TINsPerDay))
       IN IF ~IsTimeDuration(xTime) \/ ~IsTimeDuration(yTime) THEN ThrowError(yDays.s, "RangeError")
          ELSE Ok(yDays.s, IntV(TICompare(xTime, yTime)))

\* Temporal.Duration.prototype.round.
DurationRound(s, d, roundToArg) ==
  LET roundTo == StringOrOptionsObject(s, roundToArg, SV("smallestUnit")) IN IF IsAbrupt(roundTo) THEN roundTo ELSE
  LET largestOption == GetTemporalUnitValuedOption(roundTo.s, Val(roundTo), SV("largestUnit"), FALSE) IN
  IF IsAbrupt(largestOption) THEN largestOption ELSE
  LET relativeTo == GetTemporalRelativeToOption(largestOption.s, Val(roundTo)) IN IF IsAbrupt(relativeTo) THEN relativeTo ELSE
  LET increment == GetRoundingIncrementOption(relativeTo.s, Val(roundTo)) IN IF IsAbrupt(increment) THEN increment ELSE
  LET mode == GetRoundingModeOption(increment.s, Val(roundTo), N("halfExpand")) IN IF IsAbrupt(mode) THEN mode ELSE
  LET smallestOption == GetTemporalUnitValuedOption(mode.s, Val(roundTo), SV("smallestUnit"), FALSE) IN
  IF IsAbrupt(smallestOption) THEN smallestOption ELSE
  LET s1 == smallestOption.s
      smallest == IF Val(smallestOption) = TUNoUnit THEN TUNanosecond ELSE Val(smallestOption)
      existingLargest == DefaultTemporalLargestUnit(d)
      defaultLargest == LargerOfTwoTemporalUnits(existingLargest, smallest)
      largest == IF Val(largestOption) \in {TUNoUnit, TUAuto} THEN defaultLargest ELSE Val(largestOption)
      maximum == MaximumRoundingIncrement(smallest)
      inc == Val(increment)
      rm == Val(mode)
      rel == Val(relativeTo)
  IN IF Val(smallestOption) = TUAuto \/ (Val(smallestOption) = TUNoUnit /\ Val(largestOption) = TUNoUnit) \/
        LargerOfTwoTemporalUnits(largest, smallest) # largest \/
        (maximum # 0 /\ ~IsValidRoundingIncrement(inc, TI(maximum), FALSE)) \/
        (inc > 1 /\ largest # smallest /\ IsDateUnit(smallest))
     THEN ThrowError(s1, "RangeError")
     ELSE IF rel.zoned # Empty THEN
       LET z == rel.zoned
           internal == ToInternalDurationRecord(d)
           target == AddZonedDateTime(s1, z.epochNs, z.timeZone, internal, N("constrain"))
       IN IF IsAbrupt(target) THEN target ELSE
       LET r == DifferenceZonedDateTimeWithRounding(target.s, z.epochNs, Val(target), z.timeZone,
                                                    largest, inc, smallest, rm)
       IN IF IsAbrupt(r) THEN r ELSE TemporalDurationFromInternal(r.s, Val(r), IF IsDateUnit(largest) THEN TUHour ELSE largest)
     ELSE IF rel.plain # Empty THEN
       LET target == RelativePlainTarget(s1, d, rel.plain) IN IF IsAbrupt(target) THEN target ELSE
       LET r == DifferencePlainDateTimeWithRounding(target.s, Val(target).from, Val(target).to, largest, inc, smallest, rm)
       IN IF IsAbrupt(r) THEN r ELSE TemporalDurationFromInternal(r.s, Val(r), largest)
     ELSE IF IsCalendarUnit(existingLargest) \/ IsCalendarUnit(largest) THEN ThrowError(s1, "RangeError")
     ELSE LET internal == ToInternalDurationRecordWith24HourDays(d) IN
       IF smallest = TUDay THEN
         LET days == RoundRatioToIncrement(internal.time, TINsPerDay, inc, rm)
             date == <<TI(0), TI(0), TI(0), days>>
         IN IF ~IsValidDateDuration(date) THEN ThrowError(s1, "RangeError")
            ELSE TemporalDurationFromInternal(s1, CombineDateAndTimeDuration(date, TI(0)), largest)
       ELSE LET time == RoundTimeDuration(s1, internal.time, inc, smallest, rm) IN IF IsAbrupt(time) THEN time
            ELSE TemporalDurationFromInternal(time.s, CombineDateAndTimeDuration(ZeroDateDuration, Val(time)), largest)

\* Temporal.Duration.prototype.total.
DurationTotal(s, d, totalOfArg) ==
  LET totalOf == StringOrOptionsObject(s, totalOfArg, SV("unit")) IN IF IsAbrupt(totalOf) THEN totalOf ELSE
  LET relativeTo == GetTemporalRelativeToOption(totalOf.s, Val(totalOf)) IN IF IsAbrupt(relativeTo) THEN relativeTo ELSE
  LET unitOption == GetTemporalUnitValuedOption(relativeTo.s, Val(totalOf), SV("unit"), TRUE) IN
  IF IsAbrupt(unitOption) THEN unitOption ELSE
  LET s1 == unitOption.s
      unit == Val(unitOption)
      rel == Val(relativeTo)
      total == IF unit = TUAuto THEN ThrowError(s1, "RangeError")
               ELSE IF rel.zoned # Empty THEN
                 LET z == rel.zoned
                     target == AddZonedDateTime(s1, z.epochNs, z.timeZone, ToInternalDurationRecord(d), N("constrain"))
                 IN IF IsAbrupt(target) THEN target
                    ELSE DifferenceZonedDateTimeWithTotal(target.s, z.epochNs, Val(target), z.timeZone, unit)
               ELSE IF rel.plain # Empty THEN
                 LET target == RelativePlainTarget(s1, d, rel.plain) IN IF IsAbrupt(target) THEN target
                 ELSE DifferencePlainDateTimeWithTotal(target.s, Val(target).from, Val(target).to, unit)
               ELSE IF IsCalendarUnit(DefaultTemporalLargestUnit(d)) \/ IsCalendarUnit(unit) THEN ThrowError(s1, "RangeError")
               ELSE Ok(s1, RatioToNumber(ToInternalDurationRecordWith24HourDays(d).time, TemporalUnitLength(unit)))
  IN IF IsAbrupt(total) THEN total ELSE Ok(total.s, Num(Val(total)))

TemporalIntrinsics ==
  << IntrinsicObject("Temporal", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicObject("TemporalPlainTimePrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("TemporalPlainTime", "FunctionPrototype", <<"PlainTime", "constructor">>, 0, N("PlainTime"), TRUE),
     IntrinsicObject("TemporalDurationPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("TemporalDuration", "FunctionPrototype", <<"Duration", "constructor">>, 0, N("Duration"), TRUE) >>

TemporalProperties ==
  Ctor("TemporalPlainTime", "TemporalPlainTimePrototype") \o Ctor("TemporalDuration", "TemporalDurationPrototype") \o
  << V("Temporal", SymToStringTag, SV("Temporal"), FALSE, FALSE, TRUE),
     L("Temporal", SV("Duration"), "TemporalDuration", TRUE, FALSE, TRUE),
     L("Temporal", SV("Instant"), "TemporalInstant", TRUE, FALSE, TRUE),
     L("Temporal", SV("PlainDateTime"), "TemporalPlainDateTime", TRUE, FALSE, TRUE),
     L("Temporal", SV("Now"), "TemporalNow", TRUE, FALSE, TRUE),
     L("Temporal", SV("PlainDate"), "TemporalPlainDate", TRUE, FALSE, TRUE),
     L("Temporal", SV("PlainTime"), "TemporalPlainTime", TRUE, FALSE, TRUE),
     L("Temporal", SV("PlainYearMonth"), "TemporalPlainYearMonth", TRUE, FALSE, TRUE),
     L("Temporal", SV("PlainMonthDay"), "TemporalPlainMonthDay", TRUE, FALSE, TRUE),
     L("Temporal", SV("ZonedDateTime"), "TemporalZonedDateTime", TRUE, FALSE, TRUE),
     \* PlainTime (§4.2, §4.3).
     M("TemporalPlainTime", SV("from"), "PlainTime", "from", 1),
     M("TemporalPlainTime", SV("compare"), "PlainTime", "compare", 2),
     G("TemporalPlainTimePrototype", SV("hour"), "PlainTime", "hour", ""),
     G("TemporalPlainTimePrototype", SV("minute"), "PlainTime", "minute", ""),
     G("TemporalPlainTimePrototype", SV("second"), "PlainTime", "second", ""),
     G("TemporalPlainTimePrototype", SV("millisecond"), "PlainTime", "millisecond", ""),
     G("TemporalPlainTimePrototype", SV("microsecond"), "PlainTime", "microsecond", ""),
     G("TemporalPlainTimePrototype", SV("nanosecond"), "PlainTime", "nanosecond", ""),
     M("TemporalPlainTimePrototype", SV("add"), "PlainTime", "add", 1),
     M("TemporalPlainTimePrototype", SV("subtract"), "PlainTime", "subtract", 1),
     M("TemporalPlainTimePrototype", SV("with"), "PlainTime", "with", 1),
     M("TemporalPlainTimePrototype", SV("until"), "PlainTime", "until", 1),
     M("TemporalPlainTimePrototype", SV("since"), "PlainTime", "since", 1),
     M("TemporalPlainTimePrototype", SV("round"), "PlainTime", "round", 1),
     M("TemporalPlainTimePrototype", SV("equals"), "PlainTime", "equals", 1),
     M("TemporalPlainTimePrototype", SV("toString"), "PlainTime", "toString", 0),
     M("TemporalPlainTimePrototype", SV("toLocaleString"), "PlainTime", "toLocaleString", 0),
     M("TemporalPlainTimePrototype", SV("toJSON"), "PlainTime", "toJSON", 0),
     M("TemporalPlainTimePrototype", SV("valueOf"), "PlainTime", "valueOf", 0),
     V("TemporalPlainTimePrototype", SymToStringTag, SV("Temporal.PlainTime"), FALSE, FALSE, TRUE),
     \* Duration (§7.2, §7.3).
     M("TemporalDuration", SV("from"), "Duration", "from", 1),
     M("TemporalDuration", SV("compare"), "Duration", "compare", 2),
     G("TemporalDurationPrototype", SV("years"), "Duration", "years", ""),
     G("TemporalDurationPrototype", SV("months"), "Duration", "months", ""),
     G("TemporalDurationPrototype", SV("weeks"), "Duration", "weeks", ""),
     G("TemporalDurationPrototype", SV("days"), "Duration", "days", ""),
     G("TemporalDurationPrototype", SV("hours"), "Duration", "hours", ""),
     G("TemporalDurationPrototype", SV("minutes"), "Duration", "minutes", ""),
     G("TemporalDurationPrototype", SV("seconds"), "Duration", "seconds", ""),
     G("TemporalDurationPrototype", SV("milliseconds"), "Duration", "milliseconds", ""),
     G("TemporalDurationPrototype", SV("microseconds"), "Duration", "microseconds", ""),
     G("TemporalDurationPrototype", SV("nanoseconds"), "Duration", "nanoseconds", ""),
     G("TemporalDurationPrototype", SV("sign"), "Duration", "sign", ""),
     G("TemporalDurationPrototype", SV("blank"), "Duration", "blank", ""),
     M("TemporalDurationPrototype", SV("with"), "Duration", "with", 1),
     M("TemporalDurationPrototype", SV("negated"), "Duration", "negated", 0),
     M("TemporalDurationPrototype", SV("abs"), "Duration", "abs", 0),
     M("TemporalDurationPrototype", SV("add"), "Duration", "add", 1),
     M("TemporalDurationPrototype", SV("subtract"), "Duration", "subtract", 1),
     M("TemporalDurationPrototype", SV("round"), "Duration", "round", 1),
     M("TemporalDurationPrototype", SV("total"), "Duration", "total", 1),
     M("TemporalDurationPrototype", SV("toString"), "Duration", "toString", 0),
     M("TemporalDurationPrototype", SV("toJSON"), "Duration", "toJSON", 0),
     M("TemporalDurationPrototype", SV("toLocaleString"), "Duration", "toLocaleString", 0),
     M("TemporalDurationPrototype", SV("valueOf"), "Duration", "valueOf", 0),
     V("TemporalDurationPrototype", SymToStringTag, SV("Temporal.Duration"), FALSE, FALSE, TRUE),
     GlobalLink("Temporal", N("Temporal")) >>
