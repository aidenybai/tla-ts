\* Date (§21.4, §B.2.3). The model is deterministic: its local time zone is UTC, with offset 0 and
\* no daylight saving time, and its clock starts at the epoch and moves forward 1 ms each time it is read.
\* A Date object has class "date" and slots [data], its [[DateValue]] as a Number value.
\* Time values reach 8.64 × 10^15, past the 32-bit TLA+ integers, so they stay Numbers. A finite
\* time value splits exactly into its day and time within the day, which are TLA+ integers, and so
\* are the calendar fields.

MsPerSecond == 1000
MsPerMinute == 60000
MsPerHour == 3600000
MsPerDay == 86400000

\* The current time (§21.4.1.2, SystemUTCEpochMilliseconds), fixed at the epoch.
\* The current time, and the state with the clock moved on (§21.4.2.1 step 2, §21.4.3.1).
SystemTime(s) == NumFromInt(s.clock)
Tick(s) == [s EXCEPT !.clock = @ + 1]

\* x modulo n for an integral Number x and a positive integer n, as a TLA+ integer. The remainder
\* of integral Numbers is exact.
NumModInt(x, n) ==
  LET r == NumToInt(NumRemainder(x, NumFromInt(n))) IN IF r < 0 THEN r + n ELSE r

\* Day and TimeWithinDay (§21.4.1.3) of a finite time value t.
TimeWithinDay(t) == NumModInt(t, MsPerDay)
Day(t) == NumToInt(NumDivide(NumSubtract(t, NumFromInt(TimeWithinDay(t))), NumFromInt(MsPerDay)))

\* DayFromYear (§21.4.1.6) and DaysInYear (§21.4.1.5).
DayFromYear(y) ==
  365 * (y - 1970) + (y - 1969) \div 4 - (y - 1901) \div 100 + (y - 1601) \div 400
IsLeapYear(y) == (y % 4 = 0 /\ y % 100 # 0) \/ y % 400 = 0

\* YearFromTime (§21.4.1.8) of a day: the largest y with DayFromYear(y) <= day. Every 400 years
\* hold 146097 days, which gives a close first guess.
YearFromDay(day) ==
  YearAdjust(1970 + 400 * (day \div 146097) + ((day % 146097) * 400) \div 146097, day)
YearAdjust(y, day) ==
  CASE DayFromYear(y) > day -> YearAdjust(y - 1, day)
    [] DayFromYear(y + 1) <= day -> YearAdjust(y + 1, day)
    [] OTHER -> y

\* The day within the year that month m (0 to 12) starts on (§21.4.1.11), leap being 1 in a leap
\* year and 0 otherwise.
MonthStart(m, leap) ==
  <<0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365>>[m + 1] + (IF m >= 2 THEN leap ELSE 0)

\* The fields of a finite time value t (§21.4.1.3 to §21.4.1.14): YearFromTime, MonthFromTime,
\* DateFromTime, WeekDay, HourFromTime, MinuteFromTime, SecondFromTime, and MillisecondFromTime.
DateFields(t) ==
  LET day == Day(t)
      timeWithinDay == TimeWithinDay(t)
      year == YearFromDay(day)
      leap == IF IsLeapYear(year) THEN 1 ELSE 0
      dayWithinYear == day - DayFromYear(year)
      month == CHOOSE m \in 0..11 : MonthStart(m, leap) <= dayWithinYear /\ dayWithinYear < MonthStart(m + 1, leap)
  IN [year |-> year, month |-> month, date |-> dayWithinYear - MonthStart(month, leap) + 1,
      weekDay |-> (day + 4) % 7, hour |-> timeWithinDay \div MsPerHour,
      minute |-> (timeWithinDay \div MsPerMinute) % 60, second |-> (timeWithinDay \div MsPerSecond) % 60,
      ms |-> timeWithinDay % MsPerSecond, timeWithinDay |-> timeWithinDay]

\* LocalTime (§21.4.1.25) and UTC (§21.4.1.26), with the offset of the UTC time zone, 0.
LocalTime(t) == t
UTC(t) == IF NumIsFinite(t) THEN t ELSE NaN

\* MakeTime (§21.4.1.27).
MakeTime(hour, min, sec, ms) ==
  IF ~(NumIsFinite(hour) /\ NumIsFinite(min) /\ NumIsFinite(sec) /\ NumIsFinite(ms)) THEN NaN
  ELSE NumAdd(NumAdd(NumAdd(NumMultiply(NumToIntegerOrInfinity(hour), NumFromInt(MsPerHour)),
                            NumMultiply(NumToIntegerOrInfinity(min), NumFromInt(MsPerMinute))),
                     NumMultiply(NumToIntegerOrInfinity(sec), NumFromInt(MsPerSecond))),
              NumToIntegerOrInfinity(ms))

\* MakeDay (§21.4.1.28). DayFromYear(ym) is DayFromYear(ym modulo 400) plus 146097 days for each
\* 400 years, so the TLA+ integers stay small for any year.
MakeDay(year, month, date) ==
  IF ~(NumIsFinite(year) /\ NumIsFinite(month) /\ NumIsFinite(date)) THEN NaN
  ELSE
    LET m == NumToIntegerOrInfinity(month)
        mn == NumModInt(m, 12)
        ym == NumAdd(NumToIntegerOrInfinity(year),
                     NumDivide(NumSubtract(m, NumFromInt(mn)), NumFromInt(12)))
    IN IF ~NumIsFinite(ym) THEN NaN
       ELSE
         LET r == NumModInt(ym, 400)
             cycles == NumDivide(NumSubtract(ym, NumFromInt(r)), NumFromInt(400))
             days == NumAdd(NumMultiply(cycles, NumFromInt(146097)),
                            NumFromInt(DayFromYear(r) + MonthStart(mn, IF IsLeapYear(r) THEN 1 ELSE 0)))
         IN IF ~NumIsFinite(NumMultiply(days, NumFromInt(MsPerDay))) THEN NaN
            ELSE NumSubtract(NumAdd(days, NumToIntegerOrInfinity(date)), NumFromInt(1))

\* MakeDate (§21.4.1.29).
MakeDate(day, time) ==
  IF ~(NumIsFinite(day) /\ NumIsFinite(time)) THEN NaN
  ELSE LET tv == NumAdd(NumMultiply(day, NumFromInt(MsPerDay)), time) IN
       IF NumIsFinite(tv) THEN tv ELSE NaN

\* MakeFullYear (§21.4.1.30).
MakeFullYear(year) ==
  IF NumIsNaN(year) THEN NaN
  ELSE LET truncated == NumToIntegerOrInfinity(year) IN
       IF ~NumLess(truncated, PosZero) /\ ~NumLess(NumFromInt(99), truncated)
       THEN NumAdd(NumFromInt(1900), truncated) ELSE truncated

\* TimeClip (§21.4.1.31).
TimeClip(time) ==
  IF ~NumIsFinite(time) THEN NaN
  ELSE IF NumLess(NumMultiply(NumFromInt(100000000), NumFromInt(MsPerDay)), NumAbs(time)) THEN NaN
  ELSE NumToIntegerOrInfinity(time)

\* thisTimeValue: the [[DateValue]] of a Date object.
ThisTimeValue(s, v) ==
  IF IsObject(v) /\ O(s, v).class = "date" THEN Ok(s, O(s, v).slots.data) ELSE ThrowTypeError(s)

SetDateValue(s, v, u) == Ok(SetO(s, v, [O(s, v) EXCEPT !.slots.data = Num(u)]), Num(u))

\* The arguments a Date function converts with ToNumber: the first, which may be missing, and the
\* others up to n that are present.
DateArgs(args, n) == [i \in 1..(IF Len(args) <= 1 THEN 1 ELSE IF Len(args) < n THEN Len(args) ELSE n) |-> Arg(args, i)]
DateToNumbers(s, vs, acc) ==
  IF vs = <<>> THEN Ok(s, acc)
  ELSE LET n == ToNumber(s, Head(vs)) IN
       IF IsAbrupt(n) THEN n ELSE DateToNumbers(n.s, Tail(vs), Append(acc, Val(n)))

\* The time of year, month, date, hours, minutes, seconds, and ms Number values, the first two
\* given, as Date.UTC and the Date constructor compute it.
DateFromComponents(v) ==
  LET Part(i, default) == IF i <= Len(v) THEN v[i].value ELSE NumFromInt(default)
  IN MakeDate(MakeDay(MakeFullYear(v[1].value), Part(2, 0), Part(3, 1)),
              MakeTime(Part(4, 0), Part(5, 0), Part(6, 0), Part(7, 0)))

\* String formats (§21.4.4.41).
DayNames == << N("Sun"), N("Mon"), N("Tue"), N("Wed"), N("Thu"), N("Fri"), N("Sat") >>
MonthNames ==
  << N("Jan"), N("Feb"), N("Mar"), N("Apr"), N("May"), N("Jun"), N("Jul"), N("Aug"), N("Sep"),
     N("Oct"), N("Nov"), N("Dec") >>
PadStart(units, n) == Repeat(48, n - Len(units)) \o units
IntUnits(i) == NumToString(NumFromInt(i))
TwoDigits(i) == PadStart(IntUnits(i), 2)
YearUnits(y) == (IF y < 0 THEN <<45>> ELSE <<>>) \o PadStart(IntUnits(IF y < 0 THEN -y ELSE y), 4)

\* TimeString (§21.4.4.41.1).
TimeString(t) ==
  LET f == DateFields(t) IN
  TwoDigits(f.hour) \o <<58>> \o TwoDigits(f.minute) \o <<58>> \o TwoDigits(f.second) \o N(" GMT")

\* DateString (§21.4.4.41.2).
DateString(t) ==
  LET f == DateFields(t) IN
  DayNames[f.weekDay + 1] \o <<32>> \o MonthNames[f.month + 1] \o <<32>> \o TwoDigits(f.date) \o <<32>> \o
  YearUnits(f.year)

\* TimeZoneString (§21.4.4.41.3): the offset, 0, and no time zone name.
TimeZoneString(tv) == N("+0000")

\* ToDateString (§21.4.4.41.4).
ToDateString(tv) ==
  IF NumIsNaN(tv) THEN N("Invalid Date")
  ELSE LET t == LocalTime(tv) IN DateString(t) \o <<32>> \o TimeString(t) \o TimeZoneString(tv)

\* Date.prototype.toUTCString (§21.4.4.43) of a time value that isn't NaN.
UTCString(tv) ==
  LET f == DateFields(tv) IN
  DayNames[f.weekDay + 1] \o N(", ") \o TwoDigits(f.date) \o <<32>> \o MonthNames[f.month + 1] \o <<32>> \o
  YearUnits(f.year) \o <<32>> \o TimeString(tv)

\* Date.prototype.toISOString (§21.4.4.36) of a finite time value, in the Date Time String Format.
ISOString(tv) ==
  LET f == DateFields(tv)
      year == IF f.year >= 0 /\ f.year <= 9999 THEN PadStart(IntUnits(f.year), 4)
              ELSE (IF f.year < 0 THEN <<45>> ELSE <<43>>) \o PadStart(IntUnits(IF f.year < 0 THEN -f.year ELSE f.year), 6)
  IN year \o <<45>> \o TwoDigits(f.month + 1) \o <<45>> \o TwoDigits(f.date) \o <<84>> \o TwoDigits(f.hour) \o <<58>> \o
     TwoDigits(f.minute) \o <<58>> \o TwoDigits(f.second) \o <<46>> \o PadStart(IntUnits(f.ms), 3) \o <<90>>

\* Parsing (§21.4.3.2). The code unit at i, or 0 past the end.
UnitAt(u, i) == IF i >= 1 /\ i <= Len(u) THEN u[i] ELSE 0
UnitsAt(u, i, n) == [k \in 1..n |-> UnitAt(u, i + k - 1)]
\* The value of the n decimal digits at i, or -1 when they aren't all digits.
DigitsAt(u, i, n) ==
  IF n = 0 THEN 0
  ELSE LET rest == DigitsAt(u, i, n - 1) IN
       IF rest < 0 \/ ~IsDigit(UnitAt(u, i + n - 1)) THEN -1 ELSE rest * 10 + UnitAt(u, i + n - 1) - 48
DigitCount(u, i) == IF IsDigit(UnitAt(u, i)) THEN 1 + DigitCount(u, i + 1) ELSE 0

\* A parsed date: whether it parsed, its fields with a month from 1, the UTC offset in minutes,
\* and whether it is local time.
ParsedDate(ok, y, mo, d, h, mi, sec, ms, offset, local) ==
  [ok |-> ok, y |-> y, mo |-> mo, d |-> d, h |-> h, mi |-> mi, sec |-> sec, ms |-> ms, offset |-> offset, local |-> local]

\* The Date Time String Format (§21.4.1.32): YYYY, YYYY-MM, or YYYY-MM-DD, with an expanded year
\* ±YYYYYY, optionally followed by THH:mm, THH:mm:ss, or THH:mm:ss.sss and then Z or ±HH:mm.
ParseISODate(u) ==
  LET sign == UnitAt(u, 1)
      isExpanded == sign \in {43, 45}
      year == IF isExpanded THEN DigitsAt(u, 2, 6) ELSE DigitsAt(u, 1, 4)
      afterYear == IF isExpanded THEN 8 ELSE 5
      hasMonth == UnitAt(u, afterYear) = 45
      afterMonth == IF hasMonth THEN afterYear + 3 ELSE afterYear
      hasDay == hasMonth /\ UnitAt(u, afterMonth) = 45
      afterDate == IF hasDay THEN afterMonth + 3 ELSE afterMonth
      hasTime == UnitAt(u, afterDate) = 84
      i == afterDate + 1
      hasSeconds == hasTime /\ UnitAt(u, i + 5) = 58
      hasMs == hasSeconds /\ UnitAt(u, i + 8) = 46
      afterTime == CASE hasMs -> i + 12 [] hasSeconds -> i + 8 [] OTHER -> i + 5
      zone == UnitAt(u, afterTime)
      hasOffset == hasTime /\ zone \in {43, 45}
      offset == DigitsAt(u, afterTime + 1, 2) * 60 + DigitsAt(u, afterTime + 4, 2)
      end == CASE ~hasTime -> afterDate [] zone = 90 -> afterTime + 1 [] hasOffset -> afterTime + 6
                [] OTHER -> afterTime
      p == ParsedDate(TRUE, IF sign = 45 THEN -year ELSE year,
                      IF hasMonth THEN DigitsAt(u, afterYear + 1, 2) ELSE 1,
                      IF hasDay THEN DigitsAt(u, afterMonth + 1, 2) ELSE 1,
                      IF hasTime THEN DigitsAt(u, i, 2) ELSE 0,
                      IF hasTime THEN DigitsAt(u, i + 3, 2) ELSE 0,
                      IF hasSeconds THEN DigitsAt(u, i + 6, 2) ELSE 0,
                      IF hasMs THEN DigitsAt(u, i + 9, 3) ELSE 0,
                      IF hasOffset THEN (IF zone = 45 THEN -offset ELSE offset) ELSE 0,
                      hasTime /\ ~hasOffset /\ zone # 90)
      ok == /\ year >= 0 /\ ~(sign = 45 /\ year = 0) /\ Len(u) = end - 1
            /\ p.mo >= 0 /\ p.d >= 0 /\ p.h >= 0 /\ p.mi >= 0 /\ p.sec >= 0 /\ p.ms >= 0
            /\ (hasTime => UnitAt(u, i + 2) = 58)
            /\ (hasOffset => DigitsAt(u, afterTime + 1, 2) \in 0..23 /\ UnitAt(u, afterTime + 3) = 58 /\
                             DigitsAt(u, afterTime + 4, 2) \in 0..59)
  IN [p EXCEPT !.ok = ok]

\* A year of 4 to 6 digits at i, optionally negative, as toString and toUTCString write it:
\* [ok, value, next] with next the position after it.
ParseYearAt(u, i) ==
  LET isNegative == UnitAt(u, i) = 45
      start == IF isNegative THEN i + 1 ELSE i
      n == DigitCount(u, start)
      value == IF n <= 6 THEN DigitsAt(u, start, n) ELSE -1
  IN [ok |-> n >= 4 /\ value >= 0 /\ ~(isNegative /\ value = 0),
      value |-> IF isNegative THEN -value ELSE value, next |-> start + n]

\* The time HH:mm:ss at i of a date that toString or toUTCString wrote, with the year parsed and
\* the month and date at hand; the offset is a GMT±HHMM at the end for toString.
ParseTimeAt(u, i, year, month, date, hasOffset) ==
  LET h == DigitsAt(u, i, 2)
      mi == DigitsAt(u, i + 3, 2)
      sec == DigitsAt(u, i + 6, 2)
      offset == DigitsAt(u, i + 13, 2) * 60 + DigitsAt(u, i + 15, 2)
  IN ParsedDate(/\ year.ok /\ month > 0 /\ date >= 0 /\ h >= 0 /\ mi >= 0 /\ sec >= 0
                /\ UnitAt(u, i - 1) = 32 /\ UnitAt(u, i + 2) = 58 /\ UnitAt(u, i + 5) = 58
                /\ UnitsAt(u, i + 8, 4) = N(" GMT")
                /\ IF hasOffset
                   THEN UnitAt(u, i + 12) \in {43, 45} /\ DigitsAt(u, i + 13, 4) >= 0 /\ Len(u) = i + 16
                   ELSE Len(u) = i + 11,
                year.value, month, date, h, mi, sec, 0,
                CASE ~hasOffset -> 0 [] UnitAt(u, i + 12) = 45 -> -offset [] OTHER -> offset, FALSE)

\* The format of toString: Www Mmm DD YYYY HH:mm:ss GMT±HHMM.
ParseToStringDate(u) ==
  LET year == ParseYearAt(u, 12) IN
  [ParseTimeAt(u, year.next + 1, year, IndexOf(MonthNames, UnitsAt(u, 5, 3)), DigitsAt(u, 9, 2), TRUE) EXCEPT
     !.ok = @ /\ IndexOf(DayNames, UnitsAt(u, 1, 3)) > 0 /\ UnitAt(u, 4) = 32 /\ UnitAt(u, 8) = 32 /\
            UnitAt(u, 11) = 32]

\* The format of toUTCString: Www, DD Mmm YYYY HH:mm:ss GMT.
ParseUTCStringDate(u) ==
  LET year == ParseYearAt(u, 13) IN
  [ParseTimeAt(u, year.next + 1, year, IndexOf(MonthNames, UnitsAt(u, 9, 3)), DigitsAt(u, 6, 2), FALSE) EXCEPT
     !.ok = @ /\ IndexOf(DayNames, UnitsAt(u, 1, 3)) > 0 /\ UnitsAt(u, 4, 2) = N(", ") /\ UnitAt(u, 8) = 32 /\
            UnitAt(u, 12) = 32]

\* The time value of a date string, or NaN when it has none of the formats above or a value out of
\* range. 24:00 is the end of the day, so only with zero minutes, seconds, and milliseconds.
ParseDate(u) ==
  LET iso == ParseISODate(u)
      toString == ParseToStringDate(u)
      p == CASE iso.ok -> iso [] toString.ok -> toString [] OTHER -> ParseUTCStringDate(u)
      leap == IF IsLeapYear(p.y) THEN 1 ELSE 0
  IN IF ~p.ok \/ p.mo < 1 \/ p.mo > 12 \/ p.d < 1 \/ p.d > MonthStart(p.mo, leap) - MonthStart(p.mo - 1, leap) \/
        p.mi > 59 \/ p.sec > 59 \/ p.h > 24 \/ (p.h = 24 /\ (p.mi > 0 \/ p.sec > 0 \/ p.ms > 0))
     THEN NaN
     ELSE LET t == MakeDate(MakeDay(NumFromInt(p.y), NumFromInt(p.mo - 1), NumFromInt(p.d)),
                            MakeTime(NumFromInt(p.h), NumFromInt(p.mi), NumFromInt(p.sec), NumFromInt(p.ms)))
              utc == NumSubtract(t, NumFromInt(p.offset * MsPerMinute))
          IN TimeClip(IF p.local THEN UTC(utc) ELSE utc)

\* The getters (§21.4.4.2 to §21.4.4.19): the field each reads, of the local time or of the time
\* value.
DateGetters ==
  ("getDate" :> "date") @@ ("getDay" :> "weekDay") @@ ("getFullYear" :> "year") @@ ("getHours" :> "hour") @@
  ("getMilliseconds" :> "ms") @@ ("getMinutes" :> "minute") @@ ("getMonth" :> "month") @@ ("getSeconds" :> "second")
DateUTCGetters ==
  ("getUTCDate" :> "date") @@ ("getUTCDay" :> "weekDay") @@ ("getUTCFullYear" :> "year") @@ ("getUTCHours" :> "hour") @@
  ("getUTCMilliseconds" :> "ms") @@ ("getUTCMinutes" :> "minute") @@ ("getUTCMonth" :> "month") @@ ("getUTCSeconds" :> "second")

\* The setters (§21.4.4.20 to §21.4.4.26, §21.4.4.28 to §21.4.4.34): the fields their arguments
\* replace, in order. The UTC setters replace those of the time value instead of the local time.
DateSetters ==
  ("setMilliseconds" :> <<"ms">>) @@ ("setSeconds" :> <<"second", "ms">>) @@
  ("setMinutes" :> <<"minute", "second", "ms">>) @@ ("setHours" :> <<"hour", "minute", "second", "ms">>) @@
  ("setDate" :> <<"date">>) @@ ("setMonth" :> <<"month", "date">>) @@ ("setFullYear" :> <<"year", "month", "date">>)
DateUTCSetters ==
  ("setUTCMilliseconds" :> "setMilliseconds") @@ ("setUTCSeconds" :> "setSeconds") @@
  ("setUTCMinutes" :> "setMinutes") @@ ("setUTCHours" :> "setHours") @@ ("setUTCDate" :> "setDate") @@
  ("setUTCMonth" :> "setMonth") @@ ("setUTCFullYear" :> "setFullYear")

\* A setter converts its first argument and the others present, and then returns NaN for a NaN
\* time value, except setFullYear and setUTCFullYear, which start from +0. The new time keeps the
\* fields no argument replaces: MakeDay of the old year, month, and date is Day(t), and MakeTime of
\* the old hours to milliseconds is TimeWithinDay(t), as the spec's steps use.
DateSet(s, this, fields, args, isUTC) ==
  LET t == ThisTimeValue(s, this) IN IF IsAbrupt(t) THEN t ELSE
  LET n == DateToNumbers(t.s, DateArgs(args, Len(fields)), <<>>) IN IF IsAbrupt(n) THEN n ELSE
  LET tv == Val(t).value IN
  IF NumIsNaN(tv) /\ fields[1] # "year" THEN Ok(n.s, Num(NaN))
  ELSE
    LET f == DateFields(IF NumIsNaN(tv) THEN PosZero ELSE IF isUTC THEN tv ELSE LocalTime(tv))
        Field(k) == LET i == IndexOf(fields, k) IN
                    IF i = 0 \/ i > Len(Val(n)) THEN NumFromInt(f[k]) ELSE Val(n)[i].value
        date == MakeDate(MakeDay(Field("year"), Field("month"), Field("date")),
                         MakeTime(Field("hour"), Field("minute"), Field("second"), Field("ms")))
    IN SetDateValue(n.s, this, TimeClip(IF isUTC THEN date ELSE UTC(date)))

\* The Date constructor (§21.4.2.1).
DateConstructor(s, args, nt) ==
  IF nt = Undefined THEN Ok(Tick(s), Str(ToDateString(SystemTime(s))))
  ELSE
    LET tv ==
          CASE Len(args) = 0 -> Ok(Tick(s), Num(SystemTime(s)))
            [] Len(args) = 1 ->
                 LET value == args[1] IN
                 IF IsObject(value) /\ O(s, value).class = "date" THEN Ok(s, O(s, value).slots.data)
                 ELSE LET v == ToPrimitive(s, value, "none") IN
                      IF IsAbrupt(v) THEN v
                      ELSE LET n == IF IsString(Val(v)) THEN Ok(v.s, Num(ParseDate(Val(v).value))) ELSE ToNumber(v.s, Val(v)) IN
                           IF IsAbrupt(n) THEN n ELSE Ok(n.s, Num(TimeClip(Val(n).value)))
            [] OTHER ->
                 LET v == DateToNumbers(s, DateArgs(args, 7), <<>>) IN
                 IF IsAbrupt(v) THEN v ELSE Ok(v.s, Num(TimeClip(UTC(DateFromComponents(Val(v))))))
    IN IF IsAbrupt(tv) THEN tv
       ELSE OrdinaryCreateFromConstructor(tv.s, nt, "DatePrototype", "date", [data |-> Val(tv)])

DateBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" -> DateConstructor(s, args, nt)
    \* Date.now (§21.4.3.1), Date.parse (§21.4.3.2), and Date.UTC (§21.4.3.4).
    [] m = "now" -> Ok(Tick(s), Num(SystemTime(s)))
    [] m = "parse" ->
         LET str == ToStr(s, Arg(args, 1)) IN IF IsAbrupt(str) THEN str ELSE Ok(str.s, Num(ParseDate(Val(str).value)))
    [] m = "UTC" ->
         LET v == DateToNumbers(s, DateArgs(args, 7), <<>>) IN
         IF IsAbrupt(v) THEN v ELSE Ok(v.s, Num(TimeClip(DateFromComponents(Val(v)))))
    [] m \in DOMAIN DateGetters \cup DOMAIN DateUTCGetters ->
         LET t == ThisTimeValue(s, this) IN
         IF IsAbrupt(t) \/ NumIsNaN(Val(t).value) THEN t
         ELSE Ok(t.s, IntV(IF m \in DOMAIN DateGetters THEN DateFields(LocalTime(Val(t).value))[DateGetters[m]]
                           ELSE DateFields(Val(t).value)[DateUTCGetters[m]]))
    \* Date.prototype.getTime (§21.4.4.10) and valueOf (§21.4.4.44).
    [] m \in {"getTime", "valueOf"} -> ThisTimeValue(s, this)
    \* Date.prototype.getTimezoneOffset (§21.4.4.11).
    [] m = "getTimezoneOffset" ->
         LET t == ThisTimeValue(s, this) IN
         IF IsAbrupt(t) \/ NumIsNaN(Val(t).value) THEN t
         ELSE Ok(t.s, Num(NumDivide(NumSubtract(Val(t).value, LocalTime(Val(t).value)), NumFromInt(MsPerMinute))))
    [] m \in DOMAIN DateSetters -> DateSet(s, this, DateSetters[m], args, FALSE)
    [] m \in DOMAIN DateUTCSetters -> DateSet(s, this, DateSetters[DateUTCSetters[m]], args, TRUE)
    \* Date.prototype.setTime (§21.4.4.27).
    [] m = "setTime" ->
         LET t == ThisTimeValue(s, this) IN IF IsAbrupt(t) THEN t ELSE
         LET n == ToNumber(t.s, Arg(args, 1)) IN IF IsAbrupt(n) THEN n ELSE SetDateValue(n.s, this, TimeClip(Val(n).value))
    \* Date.prototype.toDateString (§21.4.4.35), toString (§21.4.4.41), toTimeString (§21.4.4.42),
    \* toUTCString (§21.4.4.43), and toLocaleDateString, toLocaleString, and toLocaleTimeString
    \* (§21.4.4.38 to §21.4.4.40), which are toString as engine262 has them.
    [] m \in {"toDateString", "toString", "toTimeString", "toUTCString", "toLocaleDateString", "toLocaleString",
              "toLocaleTimeString"} ->
         LET t == ThisTimeValue(s, this) IN IF IsAbrupt(t) THEN t ELSE
         LET tv == Val(t).value IN
         Ok(t.s, Str(CASE NumIsNaN(tv) -> N("Invalid Date")
                       [] m = "toDateString" -> DateString(LocalTime(tv))
                       [] m = "toTimeString" -> TimeString(LocalTime(tv)) \o TimeZoneString(tv)
                       [] m = "toUTCString" -> UTCString(tv)
                       [] OTHER -> ToDateString(tv)))
    \* Date.prototype.toISOString (§21.4.4.36).
    [] m = "toISOString" ->
         LET t == ThisTimeValue(s, this) IN IF IsAbrupt(t) THEN t
         ELSE IF ~NumIsFinite(Val(t).value) THEN ThrowError(t.s, "RangeError")
         ELSE Ok(t.s, Str(ISOString(Val(t).value)))
    \* Date.prototype.toTemporalInstant (Temporal §14.1.1).
    [] m = "toTemporalInstant" ->
         LET t == ThisTimeValue(s, this) IN IF IsAbrupt(t) THEN t
         ELSE IF ~NumIsFinite(Val(t).value) THEN ThrowError(t.s, "RangeError")
         ELSE CreateTemporalInstant(t.s, TIMul(IntegralNumberToBigInt(Val(t).value), TI(1000000)), Empty)
    \* Date.prototype.toJSON (§21.4.4.37).
    [] m = "toJSON" ->
         LET o == ToObject(s, this) IN IF IsAbrupt(o) THEN o ELSE
         LET tv == ToPrimitive(o.s, Val(o), "number") IN IF IsAbrupt(tv) THEN tv
         ELSE IF IsNumber(Val(tv)) /\ ~NumIsFinite(Val(tv).value) THEN Ok(tv.s, Null)
         ELSE Invoke(tv.s, Val(o), SV("toISOString"), <<>>)
    \* Date.prototype [ @@toPrimitive ] (§21.4.4.45).
    [] m = "toPrimitive" ->
         LET hint == Arg(args, 1) IN
         IF ~IsObject(this) THEN ThrowTypeError(s)
         ELSE IF IsString(hint) /\ hint.value \in {N("string"), N("default")} THEN OrdinaryToPrimitive(s, this, "string")
         ELSE IF IsString(hint) /\ hint.value = N("number") THEN OrdinaryToPrimitive(s, this, "number")
         ELSE ThrowTypeError(s)
    \* Date.prototype.getYear (§B.2.3.1).
    [] m = "getYear" ->
         LET t == ThisTimeValue(s, this) IN
         IF IsAbrupt(t) \/ NumIsNaN(Val(t).value) THEN t
         ELSE Ok(t.s, IntV(DateFields(LocalTime(Val(t).value)).year - 1900))
    \* Date.prototype.setYear (§B.2.3.2).
    [] m = "setYear" ->
         LET t == ThisTimeValue(s, this) IN IF IsAbrupt(t) THEN t ELSE
         LET y == ToNumber(t.s, Arg(args, 1)) IN IF IsAbrupt(y) THEN y ELSE
         LET local == IF NumIsNaN(Val(t).value) THEN PosZero ELSE LocalTime(Val(t).value)
             fields == DateFields(local)
             d == MakeDay(MakeFullYear(Val(y).value), NumFromInt(fields.month), NumFromInt(fields.date))
         IN SetDateValue(y.s, this, TimeClip(UTC(MakeDate(d, NumFromInt(fields.timeWithinDay)))))

DateIntrinsics ==
  << IntrinsicObject("DatePrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("Date", "FunctionPrototype", <<"Date", "constructor">>, 7, N("Date"), TRUE),
     IntrinsicFunction("DatePrototype_toUTCString", "FunctionPrototype", <<"Date", "toUTCString">>, 0, N("toUTCString"), FALSE),
     IntrinsicFunction("DatePrototype_toPrimitive", "FunctionPrototype", <<"Date", "toPrimitive">>, 1,
                       N("[Symbol.toPrimitive]"), FALSE) >>

DateProperties ==
  Ctor("Date", "DatePrototype") \o
  << GlobalLink("Date", N("Date")),
     M("Date", SV("now"), "Date", "now", 0),
     M("Date", SV("parse"), "Date", "parse", 1),
     M("Date", SV("UTC"), "Date", "UTC", 7),
     M("DatePrototype", SV("getDate"), "Date", "getDate", 0),
     M("DatePrototype", SV("getDay"), "Date", "getDay", 0),
     M("DatePrototype", SV("getFullYear"), "Date", "getFullYear", 0),
     M("DatePrototype", SV("getHours"), "Date", "getHours", 0),
     M("DatePrototype", SV("getMilliseconds"), "Date", "getMilliseconds", 0),
     M("DatePrototype", SV("getMinutes"), "Date", "getMinutes", 0),
     M("DatePrototype", SV("getMonth"), "Date", "getMonth", 0),
     M("DatePrototype", SV("getSeconds"), "Date", "getSeconds", 0),
     M("DatePrototype", SV("getTime"), "Date", "getTime", 0),
     M("DatePrototype", SV("getTimezoneOffset"), "Date", "getTimezoneOffset", 0),
     M("DatePrototype", SV("getUTCDate"), "Date", "getUTCDate", 0),
     M("DatePrototype", SV("getUTCDay"), "Date", "getUTCDay", 0),
     M("DatePrototype", SV("getUTCFullYear"), "Date", "getUTCFullYear", 0),
     M("DatePrototype", SV("getUTCHours"), "Date", "getUTCHours", 0),
     M("DatePrototype", SV("getUTCMilliseconds"), "Date", "getUTCMilliseconds", 0),
     M("DatePrototype", SV("getUTCMinutes"), "Date", "getUTCMinutes", 0),
     M("DatePrototype", SV("getUTCMonth"), "Date", "getUTCMonth", 0),
     M("DatePrototype", SV("getUTCSeconds"), "Date", "getUTCSeconds", 0),
     M("DatePrototype", SV("setDate"), "Date", "setDate", 1),
     M("DatePrototype", SV("setFullYear"), "Date", "setFullYear", 3),
     M("DatePrototype", SV("setHours"), "Date", "setHours", 4),
     M("DatePrototype", SV("setMilliseconds"), "Date", "setMilliseconds", 1),
     M("DatePrototype", SV("setMinutes"), "Date", "setMinutes", 3),
     M("DatePrototype", SV("setMonth"), "Date", "setMonth", 2),
     M("DatePrototype", SV("setSeconds"), "Date", "setSeconds", 2),
     M("DatePrototype", SV("setTime"), "Date", "setTime", 1),
     M("DatePrototype", SV("setUTCDate"), "Date", "setUTCDate", 1),
     M("DatePrototype", SV("setUTCFullYear"), "Date", "setUTCFullYear", 3),
     M("DatePrototype", SV("setUTCHours"), "Date", "setUTCHours", 4),
     M("DatePrototype", SV("setUTCMilliseconds"), "Date", "setUTCMilliseconds", 1),
     M("DatePrototype", SV("setUTCMinutes"), "Date", "setUTCMinutes", 3),
     M("DatePrototype", SV("setUTCMonth"), "Date", "setUTCMonth", 2),
     M("DatePrototype", SV("setUTCSeconds"), "Date", "setUTCSeconds", 2),
     M("DatePrototype", SV("toDateString"), "Date", "toDateString", 0),
     M("DatePrototype", SV("toISOString"), "Date", "toISOString", 0),
     M("DatePrototype", SV("toJSON"), "Date", "toJSON", 1),
     M("DatePrototype", SV("toLocaleDateString"), "Date", "toLocaleDateString", 0),
     M("DatePrototype", SV("toLocaleString"), "Date", "toLocaleString", 0),
     M("DatePrototype", SV("toLocaleTimeString"), "Date", "toLocaleTimeString", 0),
     M("DatePrototype", SV("toString"), "Date", "toString", 0),
     M("DatePrototype", SV("toTimeString"), "Date", "toTimeString", 0),
     M("DatePrototype", SV("toTemporalInstant"), "Date", "toTemporalInstant", 0),
     L("DatePrototype", SV("toUTCString"), "DatePrototype_toUTCString", TRUE, FALSE, TRUE),
     M("DatePrototype", SV("valueOf"), "Date", "valueOf", 0),
     L("DatePrototype", SymToPrimitive, "DatePrototype_toPrimitive", FALSE, FALSE, TRUE),
     M("DatePrototype", SV("getYear"), "Date", "getYear", 0),
     M("DatePrototype", SV("setYear"), "Date", "setYear", 1),
     L("DatePrototype", SV("toGMTString"), "DatePrototype_toUTCString", TRUE, FALSE, TRUE) >>
