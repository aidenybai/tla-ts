\* Temporal's ISO 8601 calendar (§12), time zones (§11), and relative durations (§7.5). An ISO
\* date record is [year, month, day] and an ISO date-time record [date, time], of TLA+ integers.
\* A calendar is "iso8601", the only one engine262 has, and a time zone is [id, offset], its
\* identifier and its offset in minutes: UTC, the only named time zone engine262 has, or an offset
\* time zone. Calendar loops over days, months, and years have closed forms here, which give the
\* loops' results.

ISO8601 == N("iso8601")
UTCTimeZone == [id |-> N("UTC"), offset |-> 0]

ISODaysInMonth(year, month) ==
  CASE month \in {1, 3, 5, 7, 8, 10, 12} -> 31
    [] month \in {4, 6, 9, 11} -> 30
    [] OTHER -> IF IsLeapYear(year) THEN 29 ELSE 28
BalanceISOYearMonth(year, month) == [year |-> year + (month - 1) \div 12, month |-> ((month - 1) % 12) + 1]

\* ISODateToEpochDays, with the day added as is.
ISODateToEpochDays(year, month, day) ==
  LET ym == BalanceISOYearMonth(year, month) IN
  DayFromYear(ym.year) + MonthStart(ym.month - 1, IF IsLeapYear(ym.year) THEN 1 ELSE 0) + day - 1
EpochDays(date) == ISODateToEpochDays(date.year, date.month, date.day)
\* The ISO date a number of days after the epoch.
EpochDaysToISODate(days) ==
  LET year == YearFromDay(days)
      leap == IF IsLeapYear(year) THEN 1 ELSE 0
      dayWithinYear == days - DayFromYear(year)
      month == CHOOSE m \in 0..11 : MonthStart(m, leap) <= dayWithinYear /\ dayWithinYear < MonthStart(m + 1, leap)
  IN [year |-> year, month |-> month + 1, day |-> dayWithinYear - MonthStart(month, leap) + 1]
AddDaysToISODate(date, days) == EpochDaysToISODate(EpochDays(date) + days)
CompareISODate(x, y) == CompareFieldsFrom(<<x.year, x.month, x.day>>, <<y.year, y.month, y.day>>, 1)
CompareISODateTime(x, y) ==
  LET d == CompareISODate(x.date, y.date) IN IF d # 0 THEN d ELSE CompareTimeRecord(x.time, y.time)

\* The epoch nanoseconds limits (nsMaxInstant), and IsWithinEpochNanosecondsInterval.
TINsMaxInstant == TIMul(TI(100000000), TINsPerDay)
IsWithinEpochNanosecondsInterval(ns) == ~BigIntLess(TINsMaxInstant, TIAbs(ns))
GetUTCEpochNanoseconds(dt) == TIAdd(TIMul(TI(EpochDays(dt.date)), TINsPerDay), TimeNanoseconds(dt.time))
IsValidISODaysRange(date) == LET days == EpochDays(date) IN days >= -100000000 /\ days <= 100000000
ISODateTimeWithinLimits(dt) ==
  LET days == EpochDays(dt.date) IN
  days >= -100000001 /\ days <= 100000000 /\
  LET ns == GetUTCEpochNanoseconds(dt) IN
  BigIntLess(TISub(TINeg(TINsMaxInstant), TINsPerDay), ns) /\ BigIntLess(ns, TIAdd(TINsMaxInstant, TINsPerDay))
ISODateWithinLimits(date) == ISODateTimeWithinLimits([date |-> date, time |-> NoonTimeRecord])
ISOYearMonthWithinLimits(date) ==
  date.year >= -271821 /\ date.year <= 275760 /\ ~(date.year = -271821 /\ date.month < 4) /\
  ~(date.year = 275760 /\ date.month > 9)

\* BalanceISODateTime of a date-time with nanoseconds added, and the ISO date-time of epoch
\* nanoseconds.
AddNanosecondsToISODateTime(dt, ns) ==
  LET balanced == BalanceTime(TIAdd(TimeNanoseconds(dt.time), ns)) IN
  [date |-> AddDaysToISODate(dt.date, TIToInt(balanced.days)), time |-> balanced.time]
EpochNsToISODateTime(ns) ==
  LET balanced == BalanceTime(ns) IN [date |-> EpochDaysToISODate(TIToInt(balanced.days)), time |-> balanced.time]

\* A year past which every date is out of range, so a larger one need not be a TLA+ integer.
TIYearInRange(year) == ~BigIntLess(TI(1000000), TIAbs(year))
\* An integer clamped to low..high.
TIClamp(a, low, high) == IF BigIntLess(a, TI(low)) THEN low ELSE IF BigIntLess(TI(high), a) THEN high ELSE TIToInt(a)

\* RegulateISODate for a year and BigInt month and day.
RegulateISODate(s, year, month, day, overflow) ==
  IF overflow = N("constrain") THEN
    LET m == TIClamp(month, 1, 12) IN
    Ok(s, [year |-> year, month |-> m, day |-> TIClamp(day, 1, ISODaysInMonth(year, m))])
  ELSE IF BigIntLess(month, TI(1)) \/ BigIntLess(TI(12), month) THEN ThrowError(s, "RangeError")
  ELSE LET m == TIToInt(month) IN
       IF BigIntLess(day, TI(1)) \/ BigIntLess(TI(ISODaysInMonth(year, m)), day) THEN ThrowError(s, "RangeError")
       ELSE Ok(s, [year |-> year, month |-> m, day |-> TIToInt(day)])

\* CalendarDateAdd for a date duration, whose fields share a sign. Past the bounds checked first,
\* every result is out of range.
CalendarDateAdd(s, date, duration, overflow) ==
  LET days == TIAdd(duration[4], TIMul(TI(7), duration[3])) IN
  IF BigIntLess(TI(600000), TIAbs(duration[1])) \/ BigIntLess(TI(7200000), TIAbs(duration[2])) \/
     BigIntLess(TI(250000000), TIAbs(days)) THEN ThrowError(s, "RangeError")
  ELSE LET ym == BalanceISOYearMonth(date.year + TIToInt(duration[1]), date.month + TIToInt(duration[2]))
           regulated == RegulateISODate(s, ym.year, TI(ym.month), TI(date.day), overflow)
       IN IF IsAbrupt(regulated) THEN regulated
          ELSE LET result == AddDaysToISODate(Val(regulated), TIToInt(days)) IN
               IF ISODateWithinLimits(result) THEN Ok(s, result) ELSE ThrowError(s, "RangeError")

\* CompareSurpasses for the ISO calendar, whose month codes order as their months do.
Surpasses(sign, year, month, day, target) ==
  sign * CompareFieldsFrom(<<year, month, day>>, <<target.year, target.month, target.day>>, 1) > 0
\* CalendarDateUntil for the ISO calendar. Each of its loops finds the largest count, in the
\* direction of sign, that doesn't surpass the target; that count is the difference of the
\* fields, or one less when the smaller fields surpass the target's.
CalendarDateUntil(from, to, largestUnit) ==
  LET compared == CompareISODate(from, to) IN
  IF compared = 0 THEN ZeroDateDuration ELSE
  LET sign == -compared
      yearsGuess == to.year - from.year
      years0 == IF Surpasses(sign, from.year + yearsGuess, from.month, from.day, to) THEN yearsGuess - sign ELSE yearsGuess
      years == IF largestUnit = TUYear /\ sign * years0 > 0 THEN years0 ELSE 0
      y0 == from.year + years
      monthsGuess == (to.year * 12 + to.month) - (y0 * 12 + from.month)
      guessed == BalanceISOYearMonth(y0, from.month + monthsGuess)
      months0 == IF Surpasses(sign, guessed.year, guessed.month, from.day, to) THEN monthsGuess - sign ELSE monthsGuess
      months == IF largestUnit <= TUMonth /\ sign * months0 > 0 THEN months0 ELSE 0
      ym == BalanceISOYearMonth(y0, from.month + months)
      regulated == [year |-> ym.year, month |-> ym.month,
                    day |-> IF from.day > ISODaysInMonth(ym.year, ym.month) THEN ISODaysInMonth(ym.year, ym.month) ELSE from.day]
      span == EpochDays(to) - EpochDays(regulated)
      weeks == IF largestUnit = TUWeek THEN sign * ((sign * span) \div 7) ELSE 0
      days == span - 7 * weeks
  IN <<TI(years), TI(months), TI(weeks), TI(IF sign * days < 0 THEN 0 ELSE days)>>

\* ISODayOfWeek, ISODayOfYear, and ISOWeekOfYear (as [week, year]).
ISODayOfWeek(date) == LET w == (EpochDays(date) + 4) % 7 IN IF w = 0 THEN 7 ELSE w
ISODayOfYear(date) == EpochDays(date) - DayFromYear(date.year) + 1
ISOWeekOfYear(date) ==
  LET year == date.year
      dayOfYear == ISODayOfYear(date)
      dayOfWeek == ISODayOfWeek(date)
      week == (dayOfYear + 7 - dayOfWeek + 3) \div 7
      jan1 == ISODayOfWeek([year |-> year, month |-> 1, day |-> 1])
  IN IF week < 1 THEN
       IF jan1 = 5 \/ (jan1 = 6 /\ IsLeapYear(year - 1)) THEN [week |-> 53, year |-> year - 1] ELSE [week |-> 52, year |-> year - 1]
     ELSE IF week = 53 /\ (IF IsLeapYear(year) THEN 366 ELSE 365) - dayOfYear < 4 - dayOfWeek THEN [week |-> 1, year |-> year + 1]
     ELSE [week |-> week, year |-> year]

\* CreateMonthCode and ParseMonthCode (as [month, leap]).
CreateMonthCode(month, leap) == <<77>> \o TwoDigits(month) \o (IF leap THEN <<76>> ELSE <<>>)
IsMonthCode(u) ==
  Len(u) \in {3, 4} /\ u[1] = 77 /\ IsDigit(u[2]) /\ IsDigit(u[3]) /\ (Len(u) = 4 => u[4] = 76) /\
  (u[2] # 48 \/ u[3] # 48 \/ Len(u) = 4)
ParseMonthCode(s, v) ==
  LET p == ToPrimitive(s, v, "string") IN IF IsAbrupt(p) THEN p
  ELSE IF ~IsString(Val(p)) THEN ThrowTypeError(p.s)
  ELSE IF ~IsMonthCode(Val(p).value) THEN ThrowError(p.s, "RangeError")
  ELSE Ok(p.s, [month |-> TPInt(Val(p).value, 2, 3), leap |-> Len(Val(p).value) = 4])

\* PadISOYear, FormatCalendarAnnotation, TemporalDateToString, and FormatISODateTime.
PadISOYear(year) ==
  IF year >= 0 /\ year <= 9999 THEN PadStart(IntUnits(year), 4)
  ELSE (IF year > 0 THEN <<43>> ELSE <<45>>) \o PadStart(IntUnits(IF year < 0 THEN -year ELSE year), 6)
FormatCalendarAnnotation(id, show) ==
  IF show = N("never") \/ (show = N("auto") /\ id = ISO8601) THEN <<>>
  ELSE <<91>> \o (IF show = N("critical") THEN <<33>> ELSE <<>>) \o N("u-ca=") \o id \o <<93>>
ISODateUnits(date) == PadISOYear(date.year) \o <<45>> \o TwoDigits(date.month) \o <<45>> \o TwoDigits(date.day)
TemporalDateToString(date, calendar, show) == ISODateUnits(date) \o FormatCalendarAnnotation(calendar, show)
FormatISODateTime(dt, calendar, precision, show) ==
  ISODateUnits(dt.date) \o <<84>> \o TimeRecordToString(dt.time, precision) \o FormatCalendarAnnotation(calendar, show)
GetTemporalShowCalendarNameOption(s, options) ==
  GetStringOption(s, options, SV("calendarName"), {N("auto"), N("always"), N("never"), N("critical")}, N("auto"))

\* Calendar identifiers: CanonicalizeCalendar, ParseTemporalCalendarString,
\* ToTemporalCalendarIdentifier, and GetTemporalCalendarIdentifierWithISODefault.
CalendarClasses == {"temporalDate", "temporalDateTime", "temporalMonthDay", "temporalYearMonth", "temporalZonedDateTime"}
CanonicalizeCalendar(s, id) == IF TPLower(id) = ISO8601 THEN Ok(s, ISO8601) ELSE ThrowError(s, "RangeError")
ParseTemporalCalendarString(s, units) ==
  LET r == ParseISODateTime(s, units, "all") IN
  IF ~IsAbrupt(r) THEN Ok(r.s, IF Val(r).calendar = Empty THEN ISO8601 ELSE Val(r).calendar)
  ELSE IF TPFull(units, TPAnnotationValue(units, 1)) THEN Ok(s, units)
  ELSE ThrowError(s, "RangeError")
ToTemporalCalendarIdentifier(s, v) ==
  IF IsObject(v) /\ O(s, v).class \in CalendarClasses THEN Ok(s, O(s, v).slots.calendar)
  ELSE IF ~IsString(v) THEN ThrowTypeError(s)
  ELSE LET id == ParseTemporalCalendarString(s, v.value) IN IF IsAbrupt(id) THEN id ELSE CanonicalizeCalendar(id.s, Val(id))
GetTemporalCalendarIdentifierWithISODefault(s, item) ==
  IF O(s, item).class \in CalendarClasses THEN Ok(s, O(s, item).slots.calendar)
  ELSE LET calendar == Get(s, item, SV("calendar")) IN IF IsAbrupt(calendar) THEN calendar
  ELSE IF Val(calendar) = Undefined THEN Ok(calendar.s, ISO8601)
  ELSE ToTemporalCalendarIdentifier(calendar.s, Val(calendar))

\* Time zones. FormatOffsetTimeZoneIdentifier, ParseTemporalTimeZoneString, and
\* ToTemporalTimeZoneIdentifier.
FormatOffsetTimeZoneIdentifier(minutes, separated) ==
  LET a == IF minutes < 0 THEN -minutes ELSE minutes IN
  (IF minutes >= 0 THEN <<43>> ELSE <<45>>) \o FormatTimeString(a \div 60, a % 60, 0, 0, TPrecisionMinute, separated)
ParseTemporalTimeZoneString(s, units) ==
  IF TPFull(units, TPTimeZoneIdentifier(units, 1)) THEN ParseTimeZoneIdentifier(s, units)
  ELSE LET r == ParseISODateTime(s, units, "all") IN IF IsAbrupt(r) THEN r
  ELSE IF Val(r).tzAnnotation # Empty THEN ParseTimeZoneIdentifier(r.s, Val(r).tzAnnotation)
  ELSE IF Val(r).z THEN ParseTimeZoneIdentifier(r.s, N("UTC"))
  ELSE IF Val(r).offset # Empty THEN ParseTimeZoneIdentifier(r.s, Val(r).offset)
  ELSE ThrowError(r.s, "RangeError")
ToTemporalTimeZoneIdentifier(s, v) ==
  IF IsObject(v) /\ O(s, v).class = "temporalZonedDateTime" THEN Ok(s, O(s, v).slots.timeZone)
  ELSE IF ~IsString(v) THEN ThrowTypeError(s)
  ELSE LET r == ParseTemporalTimeZoneString(s, v.value) IN IF IsAbrupt(r) THEN r
  ELSE IF Val(r).offsetMinutes # Empty THEN
    Ok(r.s, [id |-> FormatOffsetTimeZoneIdentifier(Val(r).offsetMinutes, TRUE), offset |-> Val(r).offsetMinutes])
  ELSE IF TPLower(Val(r).name) = N("utc") THEN Ok(r.s, UTCTimeZone)
  ELSE ThrowError(r.s, "RangeError")
TimeZoneEquals(x, y) == x.id = y.id

\* GetOffsetNanosecondsFor, GetISODateTimeFor, and GetPossibleEpochNanoseconds, which has one
\* result for a time zone with a fixed offset, so GetEpochNanosecondsFor and GetStartOfDay need no
\* disambiguation.
GetOffsetNanosecondsFor(tz) == TIMul(TI(tz.offset), TINsPerMinute)
GetISODateTimeFor(tz, ns) == EpochNsToISODateTime(TIAdd(ns, GetOffsetNanosecondsFor(tz)))
GetEpochNanosecondsFor(s, tz, dt) ==
  LET balanced == AddNanosecondsToISODateTime(dt, TINeg(GetOffsetNanosecondsFor(tz)))
      ns == GetUTCEpochNanoseconds(balanced)
  IN IF (tz # UTCTimeZone /\ ~IsValidISODaysRange(balanced.date)) \/ ~IsWithinEpochNanosecondsInterval(ns)
     THEN ThrowError(s, "RangeError") ELSE Ok(s, ns)
GetStartOfDay(s, tz, date) == GetEpochNanosecondsFor(s, tz, [date |-> date, time |-> MidnightTimeRecord])
\* The epoch nanoseconds of a date-time in a time zone, or as UTC for no time zone (Empty).
EpochNsOf(s, dt, tz) == IF tz = Empty THEN Ok(s, GetUTCEpochNanoseconds(dt)) ELSE GetEpochNanosecondsFor(s, tz, dt)

\* FormatUTCOffsetNanoseconds and FormatDateTimeUTCOffsetRounded.
FormatUTCOffsetNanoseconds(ns) ==
  LET a == TIAbs(ns)
      seconds == TIToInt(BigIntDiv(a, TINsPerSecond))
      sub == TIToInt(BigIntRem(a, TINsPerSecond))
  IN (IF ns.neg THEN <<45>> ELSE <<43>>) \o
     FormatTimeString(seconds \div 3600, (seconds \div 60) % 60, seconds % 60, sub,
                      IF seconds % 60 = 0 /\ sub = 0 THEN TPrecisionMinute ELSE TPrecisionAuto, TRUE)
FormatDateTimeUTCOffsetRounded(ns) ==
  FormatOffsetTimeZoneIdentifier(TIToInt(BigIntDiv(RoundNumberToIncrement(ns, TINsPerMinute, N("halfExpand")), TINsPerMinute)), TRUE)

\* AddEpochNanoseconds.
AddEpochNanoseconds(s, ns, d) ==
  LET r == TIAdd(ns, d) IN IF IsWithinEpochNanosecondsInterval(r) THEN Ok(s, r) ELSE ThrowError(s, "RangeError")

\* InterpretISODateTimeOffset, for an offset behaviour "option", "exact", or "wall" and a match
\* behaviour "match-exactly" or "match-minutes". A time of Empty is the start of the day.
InterpretISODateTimeOffset(s, date, time, offsetBehaviour, offsetNs, tz, offsetOption, matchBehaviour) ==
  IF time = Empty THEN GetStartOfDay(s, tz, date) ELSE
  LET dt == [date |-> date, time |-> time] IN
  IF offsetBehaviour = "wall" \/ (offsetBehaviour = "option" /\ offsetOption = N("ignore")) THEN GetEpochNanosecondsFor(s, tz, dt)
  ELSE IF offsetBehaviour = "exact" \/ (offsetBehaviour = "option" /\ offsetOption = N("use")) THEN
    LET balanced == AddNanosecondsToISODateTime(dt, TINeg(offsetNs))
        ns == GetUTCEpochNanoseconds(balanced)
    IN IF ~IsValidISODaysRange(balanced.date) \/ ~IsWithinEpochNanosecondsInterval(ns) THEN ThrowError(s, "RangeError")
       ELSE Ok(s, ns)
  ELSE IF ~IsValidISODaysRange(date) THEN ThrowError(s, "RangeError")
  ELSE LET candidate == GetEpochNanosecondsFor(s, tz, dt) IN IF IsAbrupt(candidate) THEN candidate ELSE
       LET candidateOffset == TISub(GetUTCEpochNanoseconds(dt), Val(candidate)) IN
       IF candidateOffset = offsetNs \/
          (matchBehaviour = "match-minutes" /\ RoundNumberToIncrement(candidateOffset, TINsPerMinute, N("halfExpand")) = offsetNs) \/
          offsetOption # N("reject")
       THEN candidate ELSE ThrowError(candidate.s, "RangeError")

\* Calendar fields records: the fields below, with Empty for an absent one. Numbers are BigInts,
\* monthCode and offset are units, and timeZone is a time zone.
CalendarFieldNames ==
  <<"day", "hour", "microsecond", "millisecond", "minute", "month", "monthCode", "nanosecond", "offset", "second",
    "timeZone", "year">>
CalendarFieldKeys ==
  <<SV("day"), SV("hour"), SV("microsecond"), SV("millisecond"), SV("minute"), SV("month"), SV("monthCode"),
    SV("nanosecond"), SV("offset"), SV("second"), SV("timeZone"), SV("year")>>
CalendarTimeFieldNames == {"hour", "minute", "second", "millisecond", "microsecond", "nanosecond"}
EmptyCalendarFields == [n \in Range(CalendarFieldNames) |-> Empty]
DateFieldNames == {"day", "month", "monthCode", "year"}
YearMonthFieldNames == {"month", "monthCode", "year"}

ConvertCalendarField(s, name, v) ==
  CASE name \in {"month", "day"} ->
         LET n == SnapToInteger(s, v, TRUE) IN
         IF IsAbrupt(n) THEN n ELSE IF BigIntLess(Val(n), TI(1)) THEN ThrowError(n.s, "RangeError") ELSE n
    [] name = "monthCode" ->
         LET p == ParseMonthCode(s, v) IN IF IsAbrupt(p) THEN p ELSE Ok(p.s, CreateMonthCode(Val(p).month, Val(p).leap))
    [] name = "timeZone" -> ToTemporalTimeZoneIdentifier(s, v)
    [] name = "offset" ->
         LET p == ToPrimitive(s, v, "string") IN IF IsAbrupt(p) THEN p
         ELSE IF ~IsString(Val(p)) THEN ThrowTypeError(p.s)
         ELSE LET o == ParseDateTimeUTCOffset(p.s, Val(p).value) IN IF IsAbrupt(o) THEN o ELSE Ok(o.s, Val(p).value)
    [] OTHER -> SnapToInteger(s, v, TRUE)
PrepareFrom(s, item, order, acc, isAny, required) ==
  IF order = <<>> THEN IF required = "partial" /\ ~isAny THEN ThrowTypeError(s) ELSE Ok(s, acc)
  ELSE LET name == CalendarFieldNames[Head(order)]
           v == Get(s, item, CalendarFieldKeys[Head(order)])
       IN IF IsAbrupt(v) THEN v
          ELSE IF Val(v) = Undefined THEN
            IF required = "time-zone" /\ name = "timeZone" THEN ThrowTypeError(v.s)
            ELSE PrepareFrom(v.s, item, Tail(order), acc, isAny, required)
          ELSE LET c == ConvertCalendarField(v.s, name, Val(v)) IN IF IsAbrupt(c) THEN c
          ELSE PrepareFrom(c.s, item, Tail(order), [acc EXCEPT ![name] = Val(c)], TRUE, required)
\* PrepareCalendarFields, for the set of field names to read and required "partial",
\* "time-zone", or "no-required-fields". The fields are read in code unit order.
PrepareCalendarFields(s, item, names, required) ==
  PrepareFrom(s, item, SelectSeq([i \in 1..12 |-> i], LAMBDA i : CalendarFieldNames[i] \in names),
              [n \in Range(CalendarFieldNames) |->
                 IF required # "partial" /\ n \in CalendarTimeFieldNames THEN TI(0) ELSE Empty],
              FALSE, required)

\* CalendarMergeFields for the ISO calendar.
CalendarMergeFields(fields, additional) ==
  [n \in DOMAIN fields |->
     IF additional[n] # Empty THEN additional[n]
     ELSE IF n \in {"month", "monthCode"} /\ (additional.month # Empty \/ additional.monthCode # Empty) THEN Empty
     ELSE fields[n]]

\* ISODateToFields, for type "date", "year-month", or "month-day".
ISODateToFields(date, type) ==
  [EmptyCalendarFields EXCEPT !.monthCode = CreateMonthCode(date.month, FALSE),
                              !.day = IF type \in {"date", "month-day"} THEN TI(date.day) ELSE Empty,
                              !.year = IF type \in {"date", "year-month"} THEN TI(date.year) ELSE Empty]

\* CalendarResolveFields for the ISO calendar: the fields with month set from monthCode.
CalendarResolveFields(s, fields, type) ==
  IF type \in {"date", "year-month"} /\ fields.year = Empty THEN ThrowTypeError(s)
  ELSE IF type \in {"date", "month-day"} /\ fields.day = Empty THEN ThrowTypeError(s)
  ELSE IF fields.month = Empty /\ fields.monthCode = Empty THEN ThrowTypeError(s)
  ELSE IF fields.monthCode = Empty THEN Ok(s, fields)
  ELSE LET number == TPInt(fields.monthCode, 2, 3) IN
       IF Len(fields.monthCode) = 4 \/ number > 12 \/ (fields.month # Empty /\ fields.month # TI(number))
       THEN ThrowError(s, "RangeError") ELSE Ok(s, [fields EXCEPT !.month = TI(number)])

\* CalendarDateFromFields, CalendarYearMonthFromFields, and CalendarMonthDayFromFields.
CalendarDateFromFields(s, fields, overflow) ==
  LET r == CalendarResolveFields(s, fields, "date") IN IF IsAbrupt(r) THEN r
  ELSE IF ~TIYearInRange(Val(r).year) THEN ThrowError(s, "RangeError")
  ELSE LET date == RegulateISODate(s, TIToInt(Val(r).year), Val(r).month, Val(r).day, overflow) IN
       IF IsAbrupt(date) THEN date ELSE IF ISODateWithinLimits(Val(date)) THEN date ELSE ThrowError(s, "RangeError")
CalendarYearMonthFromFields(s, fields, overflow) ==
  LET r == CalendarResolveFields(s, fields, "year-month") IN IF IsAbrupt(r) THEN r
  ELSE IF ~TIYearInRange(Val(r).year) THEN ThrowError(s, "RangeError")
  ELSE LET date == RegulateISODate(s, TIToInt(Val(r).year), Val(r).month, TI(1), overflow) IN
       IF IsAbrupt(date) THEN date ELSE IF ISOYearMonthWithinLimits(Val(date)) THEN date ELSE ThrowError(s, "RangeError")
\* The reference year 1972; a given year counts only for whether it is a leap year, which repeats
\* every 400 years.
CalendarMonthDayFromFields(s, fields, overflow) ==
  LET r == CalendarResolveFields(s, fields, "month-day") IN IF IsAbrupt(r) THEN r ELSE
  LET year == IF Val(r).year = Empty THEN 1972 ELSE TIToInt(TIMod(Val(r).year, TI(400)))
      date == RegulateISODate(s, year, Val(r).month, Val(r).day, overflow)
  IN IF IsAbrupt(date) THEN date ELSE Ok(s, [year |-> 1972, month |-> Val(date).month, day |-> Val(date).day])

\* InterpretTemporalDateTimeFields, as an ISO date-time.
InterpretTemporalDateTimeFields(s, fields, overflow) ==
  LET date == CalendarDateFromFields(s, fields, overflow) IN IF IsAbrupt(date) THEN date ELSE
  LET time == RegulateTime(date.s, <<fields.hour, fields.minute, fields.second, fields.millisecond, fields.microsecond,
                                     fields.nanosecond>>, overflow)
  IN IF IsAbrupt(time) THEN time ELSE Ok(time.s, [date |-> Val(date), time |-> Val(time)])

\* The ISO date-time of a ZonedDateTime, and its slots as a relativeTo record [epochNs, timeZone,
\* calendar].
ZonedDateTimeISODateTime(s, v) == GetISODateTimeFor(O(s, v).slots.timeZone, O(s, v).slots.epochNs)

\* Date durations: DateDurationDays and CreateDateDurationRecord's check.
DateDurationDays(s, date, plain) ==
  LET ymw == <<date[1], date[2], date[3], TI(0)>> IN
  IF DurationSign(ymw) = 0 THEN Ok(s, date[4])
  ELSE LET to == CalendarDateAdd(s, plain.date, ymw, N("constrain")) IN IF IsAbrupt(to) THEN to
  ELSE Ok(to.s, TIAdd(date[4], TI(EpochDays(Val(to)) - EpochDays(plain.date))))
InternalDurationSign(d) == LET ds == DurationSign(d.date) IN IF ds # 0 THEN ds ELSE TISign(d.time)
CheckedDateDuration(s, date) == IF IsValidDateDuration(date) THEN Ok(s, date) ELSE ThrowError(s, "RangeError")

\* ComputeNudgeWindow, as [inner, outer, startNs, endNs, startDuration, endDuration].
ComputeNudgeWindow(s, sign, duration, origin, dt, tz, increment, unit, additionalShift) ==
  LET d == duration.date
      step == TI(increment * sign)
      weeksStart == IF unit = TUWeek THEN CalendarDateAdd(s, dt.date, <<d[1], d[2], TI(0), TI(0)>>, N("constrain")) ELSE Ok(s, Empty)
  IN IF IsAbrupt(weeksStart) THEN weeksStart ELSE
  LET inner == CASE unit = TUYear ->
                      LET years == RoundNumberToIncrement(d[1], TI(increment), N("trunc")) IN
                      IF additionalShift THEN TIAdd(years, step) ELSE years
                 [] unit = TUMonth ->
                      LET months == RoundNumberToIncrement(d[2], TI(increment), N("trunc")) IN
                      IF additionalShift THEN TIAdd(months, step) ELSE months
                 [] unit = TUWeek ->
                      RoundNumberToIncrement(TIAdd(d[3], CalendarDateUntil(Val(weeksStart),
                                                                           AddDaysToISODate(Val(weeksStart), TIToInt(d[4])), TUWeek)[3]),
                                             TI(increment), N("trunc"))
                 [] OTHER -> RoundNumberToIncrement(d[4], TI(increment), N("trunc"))
      outer == TIAdd(inner, step)
      bounded(b) == CASE unit = TUYear -> <<b, TI(0), TI(0), TI(0)>>
                      [] unit = TUMonth -> <<d[1], b, TI(0), TI(0)>>
                      [] unit = TUWeek -> <<d[1], d[2], b, TI(0)>>
                      [] OTHER -> <<d[1], d[2], d[3], b>>
      start == CheckedDateDuration(weeksStart.s, bounded(inner))
  IN IF IsAbrupt(start) THEN start ELSE
  LET end == CheckedDateDuration(start.s, bounded(outer)) IN IF IsAbrupt(end) THEN end ELSE
  LET startDate == IF DurationSign(Val(start)) = 0 THEN Ok(end.s, Empty) ELSE CalendarDateAdd(end.s, dt.date, Val(start), N("constrain")) IN
  IF IsAbrupt(startDate) THEN startDate ELSE
  LET startNs == IF Val(startDate) = Empty THEN Ok(startDate.s, origin)
                 ELSE EpochNsOf(startDate.s, [date |-> Val(startDate), time |-> dt.time], tz) IN
  IF IsAbrupt(startNs) THEN startNs ELSE
  LET endDate == CalendarDateAdd(startNs.s, dt.date, Val(end), N("constrain")) IN IF IsAbrupt(endDate) THEN endDate ELSE
  LET endNs == EpochNsOf(endDate.s, [date |-> Val(endDate), time |-> dt.time], tz) IN IF IsAbrupt(endNs) THEN endNs
  ELSE Ok(endNs.s, [inner |-> inner, outer |-> outer, startNs |-> Val(startNs), endNs |-> Val(endNs),
                    startDuration |-> [date |-> Val(start), time |-> TI(0)],
                    endDuration |-> [date |-> Val(end), time |-> TI(0)]])

\* NudgeToCalendarUnit, as [nudge, total]: a nudge result [duration, nudged, expanded], and the
\* total as a rational [num, den] with den > 0. The progress through the window is
\* (dest − start) / (end − start), so total is (inner × (end − start) + (dest − start) × increment
\* × sign) / (end − start).
NudgeToCalendarUnit(s, sign, duration, origin, dest, dt, tz, increment, unit, mode) ==
  LET first == ComputeNudgeWindow(s, sign, duration, origin, dt, tz, increment, unit, FALSE) IN
  IF IsAbrupt(first) THEN first ELSE
  LET contains(w) == IF sign = 1 THEN ~BigIntLess(dest, w.startNs) /\ ~BigIntLess(w.endNs, dest)
                     ELSE ~BigIntLess(dest, w.endNs) /\ ~BigIntLess(w.startNs, dest)
      window == IF contains(Val(first)) THEN first
                ELSE ComputeNudgeWindow(first.s, sign, duration, origin, dt, tz, increment, unit, TRUE)
  IN IF IsAbrupt(window) THEN window ELSE
  LET w == Val(window)
      numer == TISub(dest, w.startNs)
      denom == TISub(w.endNs, w.startNs)
      totalNum == TIAdd(TIMul(w.inner, denom), TIMul(numer, TI(increment * sign)))
      progressNum == TIAbs(numer)
      progressDen == TIAbs(denom)
      unsigned == UnsignedRoundingMode(mode, sign < 0)
      half == TICompare(TIMul(progressNum, TI(2)), progressDen)
      isOuter == CASE progressNum = progressDen -> TRUE
                   [] progressNum.mag = <<>> -> FALSE
                   [] unsigned = "zero" -> FALSE
                   [] unsigned = "infinity" -> TRUE
                   [] half < 0 -> FALSE
                   [] half > 0 -> TRUE
                   [] unsigned = "half-zero" -> FALSE
                   [] unsigned = "half-infinity" -> TRUE
                   [] OTHER -> BNIsOdd(BigIntDiv(TIAbs(w.inner), TI(increment)).mag)
  IN Ok(window.s, [nudge |-> [duration |-> IF isOuter THEN w.endDuration ELSE w.startDuration,
                              nudged |-> IF isOuter THEN w.endNs ELSE w.startNs,
                              expanded |-> ~contains(Val(first)) \/ isOuter],
                   total |-> [num |-> IF denom.neg THEN TINeg(totalNum) ELSE totalNum, den |-> progressDen]])

\* NudgeToZonedTime.
NudgeToZonedTime(s, sign, duration, dt, tz, increment, unit, mode) ==
  LET start == CalendarDateAdd(s, dt.date, duration.date, N("constrain")) IN IF IsAbrupt(start) THEN start ELSE
  LET startNs == GetEpochNanosecondsFor(start.s, tz, [date |-> Val(start), time |-> dt.time]) IN IF IsAbrupt(startNs) THEN startNs ELSE
  LET endNs == GetEpochNanosecondsFor(startNs.s, tz, [date |-> AddDaysToISODate(Val(start), sign), time |-> dt.time]) IN
  IF IsAbrupt(endNs) THEN endNs ELSE
  LET length == TIMul(TemporalUnitLength(unit), TI(increment))
      rounded == RoundTimeDurationToIncrement(endNs.s, duration.time, length, mode)
  IN IF IsAbrupt(rounded) THEN rounded ELSE
  LET beyond == TISub(Val(rounded), TISub(Val(endNs), Val(startNs))) IN
  IF TISign(beyond) # -sign THEN
    LET again == RoundTimeDurationToIncrement(rounded.s, beyond, length, mode) IN IF IsAbrupt(again) THEN again
    ELSE Ok(again.s, [duration |-> [date |-> <<duration.date[1], duration.date[2], duration.date[3], TIAdd(duration.date[4], TI(sign))>>,
                                    time |-> Val(again)],
                      nudged |-> TIAdd(Val(again), Val(endNs)), expanded |-> TRUE])
  ELSE Ok(rounded.s, [duration |-> [date |-> duration.date, time |-> Val(rounded)],
                      nudged |-> TIAdd(Val(rounded), Val(startNs)), expanded |-> FALSE])

\* NudgeToDayOrTime.
NudgeToDayOrTime(s, duration, dest, largestUnit, increment, smallestUnit, mode) ==
  LET time == TIAdd(duration.time, TIMul(duration.date[4], TINsPerDay))
      rounded == RoundTimeDurationToIncrement(s, time, TIMul(TemporalUnitLength(smallestUnit), TI(increment)), mode)
  IN IF IsAbrupt(rounded) THEN rounded ELSE
  LET wholeDays == BigIntDiv(time, TINsPerDay)
      roundedWholeDays == BigIntDiv(Val(rounded), TINsPerDay)
      isDate == IsDateUnit(largestUnit)
  IN Ok(rounded.s, [duration |-> [date |-> <<duration.date[1], duration.date[2], duration.date[3],
                                             IF isDate THEN roundedWholeDays ELSE TI(0)>>,
                                  time |-> IF isDate THEN TISub(Val(rounded), TIMul(roundedWholeDays, TINsPerDay)) ELSE Val(rounded)],
                    nudged |-> TIAdd(dest, TISub(Val(rounded), time)),
                    expanded |-> TISign(TISub(roundedWholeDays, wholeDays)) = TISign(time)])

\* BubbleRelativeDuration.
BubbleUnits(largestUnit, startUnit) ==
  (IF startUnit = TUDay /\ largestUnit \in {TUYear, TUMonth} THEN <<TUMonth>> ELSE <<>>) \o
  (IF startUnit = TUDay /\ largestUnit = TUWeek THEN <<TUWeek>> ELSE <<>>) \o
  (IF largestUnit = TUYear THEN <<TUYear>> ELSE <<>>)
BubbleFrom(s, sign, duration, nudged, dt, tz, units) ==
  IF units = <<>> THEN Ok(s, duration) ELSE
  LET d == duration.date
      end == CASE Head(units) = TUYear -> <<TIAdd(d[1], TI(sign)), TI(0), TI(0), TI(0)>>
               [] Head(units) = TUMonth -> <<d[1], TIAdd(d[2], TI(sign)), TI(0), TI(0)>>
               [] OTHER -> <<d[1], d[2], TIAdd(d[3], TI(sign)), TI(0)>>
  IN IF ~IsValidDateDuration(end) THEN ThrowError(s, "RangeError") ELSE
  LET date == CalendarDateAdd(s, dt.date, end, N("constrain")) IN IF IsAbrupt(date) THEN date ELSE
  LET endNs == EpochNsOf(date.s, [date |-> Val(date), time |-> dt.time], tz) IN IF IsAbrupt(endNs) THEN endNs
  ELSE IF TISign(TISub(nudged, Val(endNs))) = -sign THEN Ok(endNs.s, duration)
  ELSE BubbleFrom(endNs.s, sign, [date |-> end, time |-> TI(0)], nudged, dt, tz, Tail(units))
BubbleRelativeDuration(s, sign, duration, nudged, dt, tz, largestUnit, startUnit) ==
  IF LargerOfTwoTemporalUnits(startUnit, largestUnit) = startUnit THEN Ok(s, duration)
  ELSE BubbleFrom(s, sign, duration, nudged, dt, tz, BubbleUnits(largestUnit, startUnit))

\* RoundRelativeDuration and TotalRelativeDuration, for a time zone or Empty.
RoundRelativeDuration(s, duration, origin, dest, dt, tz, largestUnit, increment, smallestUnit, mode) ==
  LET sign == IF InternalDurationSign(duration) < 0 THEN -1 ELSE 1
      nudge == CASE IsCalendarUnit(smallestUnit) \/ (tz # Empty /\ smallestUnit = TUDay) ->
                      LET r == NudgeToCalendarUnit(s, sign, duration, origin, dest, dt, tz, increment, smallestUnit, mode) IN
                      IF IsAbrupt(r) THEN r ELSE Ok(r.s, Val(r).nudge)
                 [] tz # Empty -> NudgeToZonedTime(s, sign, duration, dt, tz, increment, smallestUnit, mode)
                 [] OTHER -> NudgeToDayOrTime(s, duration, dest, largestUnit, increment, smallestUnit, mode)
  IN IF IsAbrupt(nudge) THEN nudge
     ELSE IF Val(nudge).expanded /\ smallestUnit \notin {TUYear, TUWeek} THEN
       BubbleRelativeDuration(nudge.s, sign, Val(nudge).duration, Val(nudge).nudged, dt, tz, largestUnit,
                              LargerOfTwoTemporalUnits(smallestUnit, TUDay))
     ELSE Ok(nudge.s, Val(nudge).duration)
TotalRelativeDuration(s, duration, origin, dest, dt, tz, unit) ==
  IF IsCalendarUnit(unit) \/ (tz # Empty /\ unit = TUDay) THEN
    LET r == NudgeToCalendarUnit(s, IF InternalDurationSign(duration) < 0 THEN -1 ELSE 1, duration, origin, dest, dt, tz,
                                 1, unit, N("trunc"))
    IN IF IsAbrupt(r) THEN r ELSE Ok(r.s, RatioToNumber(Val(r).total.num, Val(r).total.den))
  ELSE Ok(s, RatioToNumber(TIAdd(duration.time, TIMul(duration.date[4], TINsPerDay)), TemporalUnitLength(unit)))

\* DifferenceISODateTime, DifferencePlainDateTimeWithRounding, and DifferencePlainDateTimeWithTotal.
DifferenceISODateTime(x, y, largestUnit) ==
  LET time0 == DifferenceTime(x.time, y.time)
      timeSign == TISign(time0)
      adjust == timeSign = CompareISODate(x.date, y.date)
      time == IF adjust THEN TISub(time0, TIMul(TI(timeSign), TINsPerDay)) ELSE time0
      dateLargestUnit == LargerOfTwoTemporalUnits(TUDay, largestUnit)
      diff == CalendarDateUntil(x.date, IF adjust THEN AddDaysToISODate(y.date, timeSign) ELSE y.date, dateLargestUnit)
  IN IF largestUnit # dateLargestUnit
     THEN [date |-> <<diff[1], diff[2], diff[3], TI(0)>>, time |-> TIAdd(time, TIMul(diff[4], TINsPerDay))]
     ELSE [date |-> diff, time |-> time]
DifferencePlainDateTimeWithRounding(s, from, to, largestUnit, increment, smallestUnit, mode) ==
  IF CompareISODateTime(from, to) = 0 THEN Ok(s, CombineDateAndTimeDuration(ZeroDateDuration, TI(0)))
  ELSE IF ~ISODateTimeWithinLimits(from) \/ ~ISODateTimeWithinLimits(to) THEN ThrowError(s, "RangeError")
  ELSE LET diff == DifferenceISODateTime(from, to, largestUnit) IN
       IF smallestUnit = TUNanosecond /\ increment = 1 THEN Ok(s, diff)
       ELSE RoundRelativeDuration(s, diff, GetUTCEpochNanoseconds(from), GetUTCEpochNanoseconds(to), from, Empty,
                                  largestUnit, increment, smallestUnit, mode)
DifferencePlainDateTimeWithTotal(s, from, to, unit) ==
  IF CompareISODateTime(from, to) = 0 THEN Ok(s, PosZero)
  ELSE IF ~ISODateTimeWithinLimits(from) \/ ~ISODateTimeWithinLimits(to) THEN ThrowError(s, "RangeError")
  ELSE LET diff == DifferenceISODateTime(from, to, unit) IN
       IF unit = TUNanosecond THEN Ok(s, RatioToNumber(diff.time, TI(1)))
       ELSE TotalRelativeDuration(s, diff, GetUTCEpochNanoseconds(from), GetUTCEpochNanoseconds(to), from, Empty, unit)

\* DifferenceZonedDateTime, with its loop over day corrections.
DayCorrectionFrom(s, tz, start, end, to, sign, correction, maxCorrection) ==
  LET intermediate == [date |-> AddDaysToISODate(end.date, correction * sign), time |-> start.time]
      ns == GetEpochNanosecondsFor(s, tz, intermediate)
  IN IF IsAbrupt(ns) THEN ns
     ELSE IF TISign(TISub(to, Val(ns))) # sign \/ correction >= maxCorrection
     THEN Ok(ns.s, [date |-> intermediate.date, time |-> TISub(to, Val(ns))])
     ELSE DayCorrectionFrom(ns.s, tz, start, end, to, sign, correction + 1, maxCorrection)
DifferenceZonedDateTime(s, from, to, tz, largestUnit) ==
  IF from = to THEN Ok(s, CombineDateAndTimeDuration(ZeroDateDuration, TI(0))) ELSE
  LET start == GetISODateTimeFor(tz, from)
      end == GetISODateTimeFor(tz, to)
      sign == IF BigIntLess(to, from) THEN 1 ELSE -1
  IN IF CompareISODate(start.date, end.date) = 0 THEN Ok(s, CombineDateAndTimeDuration(ZeroDateDuration, TISub(to, from)))
     ELSE LET found == DayCorrectionFrom(s, tz, start, end, to, sign,
                                         IF TISign(DifferenceTime(start.time, end.time)) = sign THEN 1 ELSE 0,
                                         IF sign = -1 THEN 2 ELSE 1)
          IN IF IsAbrupt(found) THEN found
             ELSE Ok(found.s, CombineDateAndTimeDuration(
                                CalendarDateUntil(start.date, Val(found).date, LargerOfTwoTemporalUnits(largestUnit, TUDay)),
                                Val(found).time))
DifferenceEpochNanoseconds(s, from, to, increment, smallestUnit, mode) ==
  LET r == RoundTimeDuration(s, TISub(to, from), increment, smallestUnit, mode) IN
  IF IsAbrupt(r) THEN r ELSE Ok(r.s, CombineDateAndTimeDuration(ZeroDateDuration, Val(r)))
DifferenceZonedDateTimeWithRounding(s, from, to, tz, largestUnit, increment, smallestUnit, mode) ==
  IF IsTimeUnit(largestUnit) THEN DifferenceEpochNanoseconds(s, from, to, increment, smallestUnit, mode) ELSE
  LET diff == DifferenceZonedDateTime(s, from, to, tz, largestUnit) IN IF IsAbrupt(diff) THEN diff
  ELSE IF smallestUnit = TUNanosecond /\ increment = 1 THEN diff
  ELSE RoundRelativeDuration(diff.s, Val(diff), from, to, GetISODateTimeFor(tz, from), tz, largestUnit, increment, smallestUnit, mode)
DifferenceZonedDateTimeWithTotal(s, from, to, tz, unit) ==
  IF IsTimeUnit(unit) THEN Ok(s, RatioToNumber(TISub(to, from), TemporalUnitLength(unit))) ELSE
  LET diff == DifferenceZonedDateTime(s, from, to, tz, unit) IN IF IsAbrupt(diff) THEN diff
  ELSE TotalRelativeDuration(diff.s, Val(diff), from, to, GetISODateTimeFor(tz, from), tz, unit)

\* AddZonedDateTime.
AddZonedDateTime(s, ns, tz, duration, overflow) ==
  IF DurationSign(duration.date) = 0 THEN AddEpochNanoseconds(s, ns, duration.time) ELSE
  LET dt == GetISODateTimeFor(tz, ns)
      added == CalendarDateAdd(s, dt.date, duration.date, overflow)
  IN IF IsAbrupt(added) THEN added
     ELSE IF ~ISODateTimeWithinLimits([date |-> Val(added), time |-> dt.time]) THEN ThrowError(added.s, "RangeError")
     ELSE LET intermediate == GetEpochNanosecondsFor(added.s, tz, [date |-> Val(added), time |-> dt.time]) IN
          IF IsAbrupt(intermediate) THEN intermediate ELSE AddEpochNanoseconds(intermediate.s, Val(intermediate), duration.time)

\* The start and end of Temporal.Duration.prototype.round and total relative to a PlainDate
\* (steps 22 and 13), as [from, to] date-times.
RelativePlainTarget(s, d, plain) ==
  LET internal == ToInternalDurationRecordWith24HourDays(d)
      target == AddTime(MidnightTimeRecord, internal.time)
      date == CheckedDateDuration(s, <<internal.date[1], internal.date[2], internal.date[3], target.days>>)
  IN IF IsAbrupt(date) THEN date ELSE
  LET targetDate == CalendarDateAdd(s, plain.date, Val(date), N("constrain")) IN IF IsAbrupt(targetDate) THEN targetDate
  ELSE Ok(targetDate.s, [from |-> [date |-> plain.date, time |-> MidnightTimeRecord],
                         to |-> [date |-> Val(targetDate), time |-> target.time]])

\* GetTemporalRelativeToOption, as a relativeTo record [plain, zoned]: a [date, calendar] record
\* or a ZonedDateTime's slots.
RelativeToFrom(s, date, time, calendar, tz, offsetBehaviour, offsetString, matchBehaviour) ==
  IF tz = Empty THEN
    IF ISODateWithinLimits(date) THEN Ok(s, [plain |-> [date |-> date, calendar |-> calendar], zoned |-> Empty])
    ELSE ThrowError(s, "RangeError")
  ELSE LET offsetNs == IF offsetBehaviour = "option" THEN Val(ParseDateTimeUTCOffset(s, offsetString)) ELSE TI(0)
           ns == InterpretISODateTimeOffset(s, date, time, offsetBehaviour, offsetNs, tz, N("reject"), matchBehaviour)
       IN IF IsAbrupt(ns) THEN ns
          ELSE Ok(ns.s, [plain |-> Empty, zoned |-> [epochNs |-> Val(ns), timeZone |-> tz, calendar |-> calendar]])
GetTemporalRelativeToOption(s, options) ==
  LET value == Get(s, options, SV("relativeTo")) IN IF IsAbrupt(value) THEN value
  ELSE IF Val(value) = Undefined THEN Ok(value.s, NoRelativeTo) ELSE
  LET v == Val(value)
      s1 == value.s
  IN IF IsObject(v) THEN
       LET o == O(s1, v) IN
       CASE o.class = "temporalZonedDateTime" -> Ok(s1, [plain |-> Empty, zoned |-> o.slots])
         [] o.class = "temporalDate" -> Ok(s1, [plain |-> o.slots, zoned |-> Empty])
         [] o.class = "temporalDateTime" ->
              Ok(s1, [plain |-> [date |-> o.slots.dateTime.date, calendar |-> o.slots.calendar], zoned |-> Empty])
         [] OTHER ->
              LET calendar == GetTemporalCalendarIdentifierWithISODefault(s1, v) IN IF IsAbrupt(calendar) THEN calendar ELSE
              LET fields == PrepareCalendarFields(calendar.s, v, DateFieldNames \cup CalendarTimeFieldNames \cup {"offset", "timeZone"},
                                                  "no-required-fields") IN
              IF IsAbrupt(fields) THEN fields ELSE
              LET result == InterpretTemporalDateTimeFields(fields.s, Val(fields), N("constrain")) IN IF IsAbrupt(result) THEN result
              ELSE RelativeToFrom(result.s, Val(result).date, Val(result).time, Val(calendar), Val(fields).timeZone,
                                  IF Val(fields).offset = Empty THEN "wall" ELSE "option", Val(fields).offset, "match-exactly")
     ELSE IF ~IsString(v) THEN ThrowTypeError(s1)
     ELSE LET parsed == ParseISODateTime(s1, v.value, "any-date-time") IN IF IsAbrupt(parsed) THEN parsed ELSE
          LET r == Val(parsed)
              tz == IF r.tzAnnotation = Empty THEN Ok(parsed.s, Empty) ELSE ToTemporalTimeZoneIdentifier(parsed.s, Str(r.tzAnnotation))
          IN IF IsAbrupt(tz) THEN tz ELSE
          LET calendar == CanonicalizeCalendar(tz.s, IF r.calendar = Empty THEN ISO8601 ELSE r.calendar) IN
          IF IsAbrupt(calendar) THEN calendar
          ELSE RelativeToFrom(calendar.s, [year |-> r.year, month |-> r.month, day |-> r.day], r.time, Val(calendar), Val(tz),
                              CASE r.z -> "exact" [] r.offset = Empty -> "wall" [] OTHER -> "option", r.offset,
                              IF r.offset # Empty /\ Len(r.offset) > 6 THEN "match-exactly" ELSE "match-minutes")
