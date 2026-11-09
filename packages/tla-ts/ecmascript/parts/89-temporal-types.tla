\* The Temporal types (Temporal §3 to §10) and Temporal.Now, on the ISO calendar and the fixed-offset
\* time zones of 89-temporal-dates.
\* A Temporal.PlainDate has class "temporalDate" and slots [date, calendar].
CreateTemporalDate(s, date, calendar, newTarget) ==
  IF ~ISODateWithinLimits(date) THEN ThrowError(s, "RangeError")
  ELSE OrdinaryCreateFromConstructor(s, IF newTarget = Empty THEN Intrinsic(s, "TemporalPlainDate") ELSE newTarget,
                                     "TemporalPlainDatePrototype", "temporalDate", [date |-> date, calendar |-> calendar])

\* The overflow option of options, read for its effects only.
ReadOverflowOption(s, options) ==
  LET opts == GetOptionsObject(s, options) IN IF IsAbrupt(opts) THEN opts ELSE GetTemporalOverflowOption(opts.s, Val(opts))

\* ToTemporalDate, as [date, calendar].
ToTemporalDateRecord(s, item, options) ==
  IF IsObject(item) THEN
    LET o == O(s, item) IN
    IF o.class \in {"temporalDate", "temporalDateTime", "temporalZonedDateTime"} THEN
      LET read == ReadOverflowOption(s, options) IN IF IsAbrupt(read) THEN read
      ELSE Ok(read.s, [date |-> CASE o.class = "temporalDate" -> o.slots.date
                                  [] o.class = "temporalDateTime" -> o.slots.dateTime.date
                                  [] OTHER -> ZonedDateTimeISODateTime(s, item).date,
                       calendar |-> o.slots.calendar])
    ELSE LET calendar == GetTemporalCalendarIdentifierWithISODefault(s, item) IN IF IsAbrupt(calendar) THEN calendar ELSE
         LET fields == PrepareCalendarFields(calendar.s, item, DateFieldNames, "no-required-fields") IN IF IsAbrupt(fields) THEN fields ELSE
         LET opts == GetOptionsObject(fields.s, options) IN IF IsAbrupt(opts) THEN opts ELSE
         LET overflow == GetTemporalOverflowOption(opts.s, Val(opts)) IN IF IsAbrupt(overflow) THEN overflow ELSE
         LET date == CalendarDateFromFields(overflow.s, Val(fields), Val(overflow)) IN
         IF IsAbrupt(date) THEN date ELSE Ok(date.s, [date |-> Val(date), calendar |-> Val(calendar)])
  ELSE IF ~IsString(item) THEN ThrowTypeError(s)
  ELSE LET parsed == ParseISODateTime(s, item.value, "plain-date-time") IN IF IsAbrupt(parsed) THEN parsed ELSE
       LET calendar == CanonicalizeCalendar(parsed.s, IF Val(parsed).calendar = Empty THEN ISO8601 ELSE Val(parsed).calendar) IN
       IF IsAbrupt(calendar) THEN calendar ELSE
       LET read == ReadOverflowOption(calendar.s, options) IN IF IsAbrupt(read) THEN read ELSE
       LET date == [year |-> Val(parsed).year, month |-> Val(parsed).month, day |-> Val(parsed).day] IN
       IF ISODateWithinLimits(date) THEN Ok(read.s, [date |-> date, calendar |-> Val(calendar)]) ELSE ThrowError(read.s, "RangeError")

\* The fields a calendar date record (CalendarISOToDate) gives the getters of PlainDate and kin.
CalendarDateGetter(s, date, m) ==
  CASE m = "era" \/ m = "eraYear" -> Ok(s, Undefined)
    [] m = "year" -> Ok(s, IntV(date.year))
    [] m = "month" -> Ok(s, IntV(date.month))
    [] m = "monthCode" -> Ok(s, Str(CreateMonthCode(date.month, FALSE)))
    [] m = "day" -> Ok(s, IntV(date.day))
    [] m = "dayOfWeek" -> Ok(s, IntV(ISODayOfWeek(date)))
    [] m = "dayOfYear" -> Ok(s, IntV(ISODayOfYear(date)))
    [] m = "weekOfYear" -> Ok(s, IntV(ISOWeekOfYear(date).week))
    [] m = "yearOfWeek" -> Ok(s, IntV(ISOWeekOfYear(date).year))
    [] m = "daysInWeek" -> Ok(s, IntV(7))
    [] m = "daysInMonth" -> Ok(s, IntV(ISODaysInMonth(date.year, date.month)))
    [] m = "daysInYear" -> Ok(s, IntV(IF IsLeapYear(date.year) THEN 366 ELSE 365))
    [] m = "monthsInYear" -> Ok(s, IntV(12))
    [] m = "inLeapYear" -> Ok(s, Bool(IsLeapYear(date.year)))
CalendarDateGetters ==
  {"era", "eraYear", "year", "month", "monthCode", "day", "dayOfWeek", "dayOfYear", "weekOfYear", "yearOfWeek",
   "daysInWeek", "daysInMonth", "daysInYear", "monthsInYear", "inLeapYear"}

\* DifferenceTemporalPlainDate.
DifferenceTemporalPlainDate(s, operation, plain, other, options) ==
  LET o == ToTemporalDateRecord(s, other, Undefined) IN IF IsAbrupt(o) THEN o
  ELSE IF Val(o).calendar # plain.calendar THEN ThrowError(o.s, "RangeError") ELSE
  LET opts == GetOptionsObject(o.s, options) IN IF IsAbrupt(opts) THEN opts ELSE
  LET settings == GetDifferenceSettings(opts.s, operation, Val(opts), "date", {}, TUDay, TUDay) IN IF IsAbrupt(settings) THEN settings
  ELSE IF CompareISODate(plain.date, Val(o).date) = 0 THEN CreateTemporalDuration(settings.s, ZeroDurationFields, Empty) ELSE
  LET st == Val(settings)
      from == [date |-> plain.date, time |-> MidnightTimeRecord]
      to == [date |-> Val(o).date, time |-> MidnightTimeRecord]
      diff == CombineDateAndTimeDuration(CalendarDateUntil(plain.date, Val(o).date, st.largestUnit), TI(0))
      rounded == IF st.smallestUnit = TUDay /\ st.roundingIncrement = 1 THEN Ok(settings.s, diff)
                 ELSE RoundRelativeDuration(settings.s, diff, GetUTCEpochNanoseconds(from), GetUTCEpochNanoseconds(to), from, Empty,
                                            st.largestUnit, st.roundingIncrement, st.smallestUnit, st.roundingMode)
  IN IF IsAbrupt(rounded) THEN rounded ELSE
  LET f == DurationFieldsFromInternal(Val(rounded), TUDay) IN
  CreateTemporalDuration(rounded.s, IF operation = "since" THEN NegatedDurationFields(f) ELSE f, Empty)

\* AddDurationToDate.
AddDurationToDate(s, operation, plain, durationLike, options) ==
  LET d == ToTemporalDurationFields(s, durationLike) IN IF IsAbrupt(d) THEN d ELSE
  LET internal == ToInternalDurationRecordWith24HourDays(IF operation = "subtract" THEN NegatedDurationFields(Val(d)) ELSE Val(d))
      dateDuration == <<internal.date[1], internal.date[2], internal.date[3], BigIntDiv(internal.time, TINsPerDay)>>
      opts == GetOptionsObject(d.s, options)
  IN IF IsAbrupt(opts) THEN opts ELSE
  LET overflow == GetTemporalOverflowOption(opts.s, Val(opts)) IN IF IsAbrupt(overflow) THEN overflow ELSE
  LET result == CalendarDateAdd(overflow.s, plain.date, dateDuration, Val(overflow)) IN
  IF IsAbrupt(result) THEN result ELSE CreateTemporalDate(result.s, Val(result), plain.calendar, Empty)

\* ToTimeRecordOrMidnight.
ToTimeRecordOrMidnight(s, item) == IF item = Undefined THEN Ok(s, MidnightTimeRecord) ELSE ToTemporalTimeRecord(s, item, Undefined)

PlainDateBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" ->
         IF nt = Undefined THEN ThrowTypeError(s) ELSE
         LET year == SnapToInteger(s, Arg(args, 1), TRUE) IN IF IsAbrupt(year) THEN year ELSE
         LET month == SnapToInteger(year.s, Arg(args, 2), TRUE) IN IF IsAbrupt(month) THEN month ELSE
         LET day == SnapToInteger(month.s, Arg(args, 3), TRUE) IN IF IsAbrupt(day) THEN day ELSE
         LET calendarArg == IF Arg(args, 4) = Undefined THEN Str(ISO8601) ELSE Arg(args, 4) IN
         IF ~IsString(calendarArg) THEN ThrowTypeError(day.s) ELSE
         LET calendar == CanonicalizeCalendar(day.s, calendarArg.value) IN IF IsAbrupt(calendar) THEN calendar
         ELSE IF ~TIYearInRange(Val(year)) THEN ThrowError(calendar.s, "RangeError") ELSE
         LET date == RegulateISODate(calendar.s, TIToInt(Val(year)), Val(month), Val(day), N("reject")) IN
         IF IsAbrupt(date) THEN date ELSE CreateTemporalDate(date.s, Val(date), Val(calendar), nt)
    [] m = "from" ->
         LET r == ToTemporalDateRecord(s, Arg(args, 1), Arg(args, 2)) IN
         IF IsAbrupt(r) THEN r ELSE CreateTemporalDate(r.s, Val(r).date, Val(r).calendar, Empty)
    [] m = "compare" ->
         LET x == ToTemporalDateRecord(s, Arg(args, 1), Undefined) IN IF IsAbrupt(x) THEN x ELSE
         LET y == ToTemporalDateRecord(x.s, Arg(args, 2), Undefined) IN IF IsAbrupt(y) THEN y
         ELSE Ok(y.s, IntV(CompareISODate(Val(x).date, Val(y).date)))
    [] ~HasClass(s, this, "temporalDate") -> ThrowTypeError(s)
    [] OTHER ->
         LET plain == O(s, this).slots
             date == plain.date
         IN CASE m \in CalendarDateGetters -> CalendarDateGetter(s, date, m)
              [] m = "calendarId" -> Ok(s, Str(plain.calendar))
              [] m = "toPlainYearMonth" ->
                   LET ym == CalendarYearMonthFromFields(s, ISODateToFields(date, "date"), N("constrain")) IN
                   IF IsAbrupt(ym) THEN ym ELSE CreateTemporalYearMonth(ym.s, Val(ym), plain.calendar, Empty)
              [] m = "toPlainMonthDay" ->
                   LET md == CalendarMonthDayFromFields(s, ISODateToFields(date, "date"), N("constrain")) IN
                   IF IsAbrupt(md) THEN md ELSE CreateTemporalMonthDay(md.s, Val(md), plain.calendar, Empty)
              [] m \in {"add", "subtract"} -> AddDurationToDate(s, m, plain, Arg(args, 1), Arg(args, 2))
              [] m = "with" ->
                   LET isPartial == IsPartialTemporalObject(s, Arg(args, 1)) IN IF IsAbrupt(isPartial) THEN isPartial
                   ELSE IF ~Val(isPartial) THEN ThrowTypeError(isPartial.s) ELSE
                   LET partial == PrepareCalendarFields(isPartial.s, Arg(args, 1), DateFieldNames, "partial") IN
                   IF IsAbrupt(partial) THEN partial ELSE
                   LET fields == CalendarMergeFields(ISODateToFields(date, "date"), Val(partial))
                       opts == GetOptionsObject(partial.s, Arg(args, 2))
                   IN IF IsAbrupt(opts) THEN opts ELSE
                   LET overflow == GetTemporalOverflowOption(opts.s, Val(opts)) IN IF IsAbrupt(overflow) THEN overflow ELSE
                   LET r == CalendarDateFromFields(overflow.s, fields, Val(overflow)) IN
                   IF IsAbrupt(r) THEN r ELSE CreateTemporalDate(r.s, Val(r), plain.calendar, Empty)
              [] m = "withCalendar" ->
                   LET calendar == ToTemporalCalendarIdentifier(s, Arg(args, 1)) IN
                   IF IsAbrupt(calendar) THEN calendar ELSE CreateTemporalDate(calendar.s, date, Val(calendar), Empty)
              [] m \in {"until", "since"} -> DifferenceTemporalPlainDate(s, m, plain, Arg(args, 1), Arg(args, 2))
              [] m = "equals" ->
                   LET other == ToTemporalDateRecord(s, Arg(args, 1), Undefined) IN IF IsAbrupt(other) THEN other
                   ELSE Ok(other.s, Bool(CompareISODate(date, Val(other).date) = 0 /\ plain.calendar = Val(other).calendar))
              [] m = "toPlainDateTime" ->
                   LET time == ToTimeRecordOrMidnight(s, Arg(args, 1)) IN IF IsAbrupt(time) THEN time
                   ELSE CreateTemporalDateTime(time.s, [date |-> date, time |-> Val(time)], plain.calendar, Empty)
              [] m = "toZonedDateTime" -> PlainDateToZonedDateTime(s, plain, Arg(args, 1))
              [] m = "toString" ->
                   LET opts == GetOptionsObject(s, Arg(args, 1)) IN IF IsAbrupt(opts) THEN opts ELSE
                   LET show == GetTemporalShowCalendarNameOption(opts.s, Val(opts)) IN IF IsAbrupt(show) THEN show
                   ELSE Ok(show.s, Str(TemporalDateToString(date, plain.calendar, Val(show))))
              [] m \in {"toLocaleString", "toJSON"} -> Ok(s, Str(TemporalDateToString(date, plain.calendar, N("auto"))))
              [] m = "valueOf" -> ThrowTypeError(s)

\* Temporal.PlainDate.prototype.toZonedDateTime.
PlainDateToZonedDateTime(s, plain, item) ==
  LET timeZoneLike == IF IsObject(item) THEN Get(s, item, SV("timeZone")) ELSE Ok(s, Undefined) IN
  IF IsAbrupt(timeZoneLike) THEN timeZoneLike ELSE
  LET tz == ToTemporalTimeZoneIdentifier(timeZoneLike.s, IF Val(timeZoneLike) = Undefined THEN item ELSE Val(timeZoneLike)) IN
  IF IsAbrupt(tz) THEN tz ELSE
  LET temporalTime == IF IsObject(item) /\ Val(timeZoneLike) # Undefined THEN Get(tz.s, item, SV("plainTime")) ELSE Ok(tz.s, Undefined) IN
  IF IsAbrupt(temporalTime) THEN temporalTime ELSE
  LET ns == IF Val(temporalTime) = Undefined THEN GetStartOfDay(temporalTime.s, Val(tz), plain.date)
            ELSE LET time == ToTemporalTimeRecord(temporalTime.s, Val(temporalTime), Undefined) IN IF IsAbrupt(time) THEN time ELSE
                 LET dt == [date |-> plain.date, time |-> Val(time)] IN
                 IF ~ISODateTimeWithinLimits(dt) THEN ThrowError(time.s, "RangeError") ELSE GetEpochNanosecondsFor(time.s, Val(tz), dt)
  IN IF IsAbrupt(ns) THEN ns ELSE CreateTemporalZonedDateTime(ns.s, Val(ns), Val(tz), plain.calendar, Empty)

\* PlainDateTime (Temporal §5). A Temporal.PlainDateTime has class "temporalDateTime" and slots
\* [dateTime, calendar].
CreateTemporalDateTime(s, dt, calendar, newTarget) ==
  IF ~ISODateTimeWithinLimits(dt) THEN ThrowError(s, "RangeError")
  ELSE OrdinaryCreateFromConstructor(s, IF newTarget = Empty THEN Intrinsic(s, "TemporalPlainDateTime") ELSE newTarget,
                                     "TemporalPlainDateTimePrototype", "temporalDateTime", [dateTime |-> dt, calendar |-> calendar])

\* ToTemporalDateTime, as [dateTime, calendar].
ToTemporalDateTimeRecord(s, item, options) ==
  IF IsObject(item) THEN
    LET o == O(s, item) IN
    IF o.class \in {"temporalDate", "temporalDateTime", "temporalZonedDateTime"} THEN
      LET read == ReadOverflowOption(s, options) IN IF IsAbrupt(read) THEN read
      ELSE Ok(read.s, [dateTime |-> CASE o.class = "temporalDateTime" -> o.slots.dateTime
                                      [] o.class = "temporalDate" -> [date |-> o.slots.date, time |-> MidnightTimeRecord]
                                      [] OTHER -> ZonedDateTimeISODateTime(s, item),
                       calendar |-> o.slots.calendar])
    ELSE LET calendar == GetTemporalCalendarIdentifierWithISODefault(s, item) IN IF IsAbrupt(calendar) THEN calendar ELSE
         LET fields == PrepareCalendarFields(calendar.s, item, DateFieldNames \cup CalendarTimeFieldNames, "no-required-fields") IN
         IF IsAbrupt(fields) THEN fields ELSE
         LET opts == GetOptionsObject(fields.s, options) IN IF IsAbrupt(opts) THEN opts ELSE
         LET overflow == GetTemporalOverflowOption(opts.s, Val(opts)) IN IF IsAbrupt(overflow) THEN overflow ELSE
         LET dt == InterpretTemporalDateTimeFields(overflow.s, Val(fields), Val(overflow)) IN IF IsAbrupt(dt) THEN dt
         ELSE IF ISODateTimeWithinLimits(Val(dt)) THEN Ok(dt.s, [dateTime |-> Val(dt), calendar |-> Val(calendar)])
         ELSE ThrowError(dt.s, "RangeError")
  ELSE IF ~IsString(item) THEN ThrowTypeError(s)
  ELSE LET parsed == ParseISODateTime(s, item.value, "plain-date-time") IN IF IsAbrupt(parsed) THEN parsed ELSE
       LET r == Val(parsed)
           calendar == CanonicalizeCalendar(parsed.s, IF r.calendar = Empty THEN ISO8601 ELSE r.calendar)
       IN IF IsAbrupt(calendar) THEN calendar ELSE
       LET read == ReadOverflowOption(calendar.s, options) IN IF IsAbrupt(read) THEN read ELSE
       LET dt == [date |-> [year |-> r.year, month |-> r.month, day |-> r.day],
                  time |-> IF r.time = Empty THEN MidnightTimeRecord ELSE r.time]
       IN IF ISODateTimeWithinLimits(dt) THEN Ok(read.s, [dateTime |-> dt, calendar |-> Val(calendar)]) ELSE ThrowError(read.s, "RangeError")

\* RoundISODateTime.
RoundISODateTime(dt, increment, unit, mode) ==
  LET rounded == RoundTime(dt.time, increment, unit, mode) IN
  [date |-> AddDaysToISODate(dt.date, TIToInt(rounded.days)), time |-> rounded.time]

\* The fields of a date-time, for CalendarMergeFields.
ISODateTimeToFields(dt) ==
  [ISODateToFields(dt.date, "date") EXCEPT !.hour = TI(dt.time.hour), !.minute = TI(dt.time.minute),
                                           !.second = TI(dt.time.second), !.millisecond = TI(dt.time.millisecond),
                                           !.microsecond = TI(dt.time.microsecond), !.nanosecond = TI(dt.time.nanosecond)]

\* The negation of a duration's fields for "since".
SinceFields(operation, f) == IF operation = "since" THEN NegatedDurationFields(f) ELSE f

\* DifferenceTemporalPlainDateTime and AddDurationToDateTime.
DifferenceTemporalPlainDateTime(s, operation, plain, other, options) ==
  LET o == ToTemporalDateTimeRecord(s, other, Undefined) IN IF IsAbrupt(o) THEN o
  ELSE IF Val(o).calendar # plain.calendar THEN ThrowError(o.s, "RangeError") ELSE
  LET opts == GetOptionsObject(o.s, options) IN IF IsAbrupt(opts) THEN opts ELSE
  LET settings == GetDifferenceSettings(opts.s, operation, Val(opts), "datetime", {}, TUNanosecond, TUDay) IN
  IF IsAbrupt(settings) THEN settings
  ELSE IF CompareISODateTime(plain.dateTime, Val(o).dateTime) = 0 THEN CreateTemporalDuration(settings.s, ZeroDurationFields, Empty) ELSE
  LET st == Val(settings)
      diff == DifferencePlainDateTimeWithRounding(settings.s, plain.dateTime, Val(o).dateTime, st.largestUnit,
                                                  st.roundingIncrement, st.smallestUnit, st.roundingMode)
  IN IF IsAbrupt(diff) THEN diff
     ELSE CreateTemporalDuration(diff.s, SinceFields(operation, DurationFieldsFromInternal(Val(diff), st.largestUnit)), Empty)
AddDurationToDateTime(s, operation, plain, durationLike, options) ==
  LET d == ToTemporalDurationFields(s, durationLike) IN IF IsAbrupt(d) THEN d ELSE
  LET opts == GetOptionsObject(d.s, options) IN IF IsAbrupt(opts) THEN opts ELSE
  LET overflow == GetTemporalOverflowOption(opts.s, Val(opts)) IN IF IsAbrupt(overflow) THEN overflow ELSE
  LET internal == ToInternalDurationRecordWith24HourDays(IF operation = "subtract" THEN NegatedDurationFields(Val(d)) ELSE Val(d))
      timeResult == AddTime(plain.dateTime.time, internal.time)
      dateDuration == CheckedDateDuration(overflow.s, <<internal.date[1], internal.date[2], internal.date[3], timeResult.days>>)
  IN IF IsAbrupt(dateDuration) THEN dateDuration ELSE
  LET added == CalendarDateAdd(dateDuration.s, plain.dateTime.date, Val(dateDuration), Val(overflow)) IN IF IsAbrupt(added) THEN added
  ELSE CreateTemporalDateTime(added.s, [date |-> Val(added), time |-> timeResult.time], plain.calendar, Empty)

\* The smallestUnit and roundingIncrement of round on PlainDateTime and ZonedDateTime: a time unit
\* or day, and an increment that divides the next larger unit (or is 1 for day).
IsValidDayOrTimeRounding(unit, increment) ==
  IsValidUnitValue(unit, "time", {TUDay}) /\
  IsValidRoundingIncrement(increment, TI(IF unit = TUDay THEN 1 ELSE MaximumRoundingIncrement(unit)), unit = TUDay)
\* The roundTo options of round on PlainDateTime and ZonedDateTime: [increment, mode, unit].
GetDayOrTimeRoundingOptions(s, roundToArg) ==
  LET roundTo == StringOrOptionsObject(s, roundToArg, SV("smallestUnit")) IN IF IsAbrupt(roundTo) THEN roundTo ELSE
  LET increment == GetRoundingIncrementOption(roundTo.s, Val(roundTo)) IN IF IsAbrupt(increment) THEN increment ELSE
  LET mode == GetRoundingModeOption(increment.s, Val(roundTo), N("halfExpand")) IN IF IsAbrupt(mode) THEN mode ELSE
  LET unit == GetTemporalUnitValuedOption(mode.s, Val(roundTo), SV("smallestUnit"), TRUE) IN IF IsAbrupt(unit) THEN unit
  ELSE IF ~IsValidDayOrTimeRounding(Val(unit), Val(increment)) THEN ThrowError(unit.s, "RangeError")
  ELSE Ok(unit.s, [increment |-> Val(increment), mode |-> Val(mode), unit |-> Val(unit)])

\* The options of toString on PlainTime's kin after showCalendar: [digits, mode, unit], with
\* GetTemporalFractionalSecondDigitsOption, GetRoundingModeOption, and the smallestUnit.
GetTimeStringOptions(s, options) ==
  LET digits == GetTemporalFractionalSecondDigitsOption(s, options) IN IF IsAbrupt(digits) THEN digits ELSE
  LET mode == GetRoundingModeOption(digits.s, options, N("trunc")) IN IF IsAbrupt(mode) THEN mode ELSE
  LET unit == GetTemporalUnitValuedOption(mode.s, options, SV("smallestUnit"), FALSE) IN IF IsAbrupt(unit) THEN unit
  ELSE Ok(unit.s, [digits |-> Val(digits), mode |-> Val(mode), unit |-> Val(unit)])
IsValidStringUnit(unit) == IsValidUnitValue(unit, "time", {}) /\ unit # TUHour

PlainDateTimeBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" ->
         IF nt = Undefined THEN ThrowTypeError(s) ELSE
         LET year == SnapToInteger(s, Arg(args, 1), TRUE) IN IF IsAbrupt(year) THEN year ELSE
         LET month == SnapToInteger(year.s, Arg(args, 2), TRUE) IN IF IsAbrupt(month) THEN month ELSE
         LET day == SnapToInteger(month.s, Arg(args, 3), TRUE) IN IF IsAbrupt(day) THEN day ELSE
         LET time == SnapArgs(day.s, args, 4, 9, TRUE, <<>>) IN IF IsAbrupt(time) THEN time ELSE
         LET calendarArg == IF Arg(args, 10) = Undefined THEN Str(ISO8601) ELSE Arg(args, 10) IN
         IF ~IsString(calendarArg) THEN ThrowTypeError(time.s) ELSE
         LET calendar == CanonicalizeCalendar(time.s, calendarArg.value) IN IF IsAbrupt(calendar) THEN calendar
         ELSE IF ~TIYearInRange(Val(year)) THEN ThrowError(calendar.s, "RangeError") ELSE
         LET date == RegulateISODate(calendar.s, TIToInt(Val(year)), Val(month), Val(day), N("reject")) IN IF IsAbrupt(date) THEN date ELSE
         LET t == RegulateTime(date.s, Val(time), N("reject")) IN IF IsAbrupt(t) THEN t
         ELSE CreateTemporalDateTime(t.s, [date |-> Val(date), time |-> Val(t)], Val(calendar), nt)
    [] m = "from" ->
         LET r == ToTemporalDateTimeRecord(s, Arg(args, 1), Arg(args, 2)) IN
         IF IsAbrupt(r) THEN r ELSE CreateTemporalDateTime(r.s, Val(r).dateTime, Val(r).calendar, Empty)
    [] m = "compare" ->
         LET x == ToTemporalDateTimeRecord(s, Arg(args, 1), Undefined) IN IF IsAbrupt(x) THEN x ELSE
         LET y == ToTemporalDateTimeRecord(x.s, Arg(args, 2), Undefined) IN IF IsAbrupt(y) THEN y
         ELSE Ok(y.s, IntV(CompareISODateTime(Val(x).dateTime, Val(y).dateTime)))
    [] ~HasClass(s, this, "temporalDateTime") -> ThrowTypeError(s)
    [] OTHER ->
         LET plain == O(s, this).slots
             dt == plain.dateTime
         IN CASE m \in CalendarDateGetters -> CalendarDateGetter(s, dt.date, m)
              [] m \in {"hour", "minute", "second", "millisecond", "microsecond", "nanosecond"} -> Ok(s, IntV(dt.time[m]))
              [] m = "calendarId" -> Ok(s, Str(plain.calendar))
              [] m = "with" ->
                   LET isPartial == IsPartialTemporalObject(s, Arg(args, 1)) IN IF IsAbrupt(isPartial) THEN isPartial
                   ELSE IF ~Val(isPartial) THEN ThrowTypeError(isPartial.s) ELSE
                   LET partial == PrepareCalendarFields(isPartial.s, Arg(args, 1), DateFieldNames \cup CalendarTimeFieldNames, "partial") IN
                   IF IsAbrupt(partial) THEN partial ELSE
                   LET opts == GetOptionsObject(partial.s, Arg(args, 2)) IN IF IsAbrupt(opts) THEN opts ELSE
                   LET overflow == GetTemporalOverflowOption(opts.s, Val(opts)) IN IF IsAbrupt(overflow) THEN overflow ELSE
                   LET r == InterpretTemporalDateTimeFields(overflow.s, CalendarMergeFields(ISODateTimeToFields(dt), Val(partial)), Val(overflow)) IN
                   IF IsAbrupt(r) THEN r ELSE CreateTemporalDateTime(r.s, Val(r), plain.calendar, Empty)
              [] m = "withPlainTime" ->
                   LET time == ToTimeRecordOrMidnight(s, Arg(args, 1)) IN IF IsAbrupt(time) THEN time
                   ELSE CreateTemporalDateTime(time.s, [date |-> dt.date, time |-> Val(time)], plain.calendar, Empty)
              [] m = "withCalendar" ->
                   LET calendar == ToTemporalCalendarIdentifier(s, Arg(args, 1)) IN
                   IF IsAbrupt(calendar) THEN calendar ELSE CreateTemporalDateTime(calendar.s, dt, Val(calendar), Empty)
              [] m \in {"add", "subtract"} -> AddDurationToDateTime(s, m, plain, Arg(args, 1), Arg(args, 2))
              [] m \in {"until", "since"} -> DifferenceTemporalPlainDateTime(s, m, plain, Arg(args, 1), Arg(args, 2))
              [] m = "round" ->
                   LET r == GetDayOrTimeRoundingOptions(s, Arg(args, 1)) IN IF IsAbrupt(r) THEN r
                   ELSE CreateTemporalDateTime(r.s, RoundISODateTime(dt, Val(r).increment, Val(r).unit, Val(r).mode), plain.calendar, Empty)
              [] m = "equals" ->
                   LET other == ToTemporalDateTimeRecord(s, Arg(args, 1), Undefined) IN IF IsAbrupt(other) THEN other
                   ELSE Ok(other.s, Bool(CompareISODateTime(dt, Val(other).dateTime) = 0 /\ plain.calendar = Val(other).calendar))
              [] m = "toString" ->
                   LET opts == GetOptionsObject(s, Arg(args, 1)) IN IF IsAbrupt(opts) THEN opts ELSE
                   LET show == GetTemporalShowCalendarNameOption(opts.s, Val(opts)) IN IF IsAbrupt(show) THEN show ELSE
                   LET o == GetTimeStringOptions(show.s, Val(opts)) IN IF IsAbrupt(o) THEN o
                   ELSE IF ~IsValidStringUnit(Val(o).unit) THEN ThrowError(o.s, "RangeError") ELSE
                   LET precision == ToSecondsStringPrecisionRecord(Val(o).unit, Val(o).digits)
                       result == RoundISODateTime(dt, precision.increment, precision.unit, Val(o).mode)
                   IN IF ~ISODateTimeWithinLimits(result) THEN ThrowError(o.s, "RangeError")
                      ELSE Ok(o.s, Str(FormatISODateTime(result, plain.calendar, precision.precision, Val(show))))
              [] m \in {"toLocaleString", "toJSON"} -> Ok(s, Str(FormatISODateTime(dt, plain.calendar, TPrecisionAuto, N("auto"))))
              [] m = "valueOf" -> ThrowTypeError(s)
              [] m = "toZonedDateTime" ->
                   LET tz == ToTemporalTimeZoneIdentifier(s, Arg(args, 1)) IN IF IsAbrupt(tz) THEN tz ELSE
                   LET opts == GetOptionsObject(tz.s, Arg(args, 2)) IN IF IsAbrupt(opts) THEN opts ELSE
                   LET disambiguation == GetTemporalDisambiguationOption(opts.s, Val(opts)) IN IF IsAbrupt(disambiguation) THEN disambiguation ELSE
                   LET ns == GetEpochNanosecondsFor(disambiguation.s, Val(tz), dt) IN
                   IF IsAbrupt(ns) THEN ns ELSE CreateTemporalZonedDateTime(ns.s, Val(ns), Val(tz), plain.calendar, Empty)
              [] m = "toPlainDate" -> CreateTemporalDate(s, dt.date, plain.calendar, Empty)
              [] m = "toPlainTime" -> CreateTemporalTime(s, dt.time, Empty)

\* ZonedDateTime (Temporal §6). A Temporal.ZonedDateTime has class "temporalZonedDateTime" and
\* slots [epochNs, timeZone, calendar].
CreateTemporalZonedDateTime(s, ns, tz, calendar, newTarget) ==
  OrdinaryCreateFromConstructor(s, IF newTarget = Empty THEN Intrinsic(s, "TemporalZonedDateTime") ELSE newTarget,
                                "TemporalZonedDateTimePrototype", "temporalZonedDateTime",
                                [epochNs |-> ns, timeZone |-> tz, calendar |-> calendar])
ZonedFromSlots(s, z) == CreateTemporalZonedDateTime(s, z.epochNs, z.timeZone, z.calendar, Empty)

\* GetTemporalDisambiguationOption, GetTemporalOffsetOption, GetTemporalShowOffsetOption, and
\* GetTemporalShowTimeZoneNameOption.
GetTemporalDisambiguationOption(s, options) ==
  GetStringOption(s, options, SV("disambiguation"), {N("compatible"), N("earlier"), N("later"), N("reject")}, N("compatible"))
GetTemporalOffsetOption(s, options, fallback) ==
  GetStringOption(s, options, SV("offset"), {N("prefer"), N("use"), N("ignore"), N("reject")}, fallback)
GetTemporalShowOffsetOption(s, options) == GetStringOption(s, options, SV("offset"), {N("auto"), N("never")}, N("auto"))
GetTemporalShowTimeZoneNameOption(s, options) ==
  GetStringOption(s, options, SV("timeZoneName"), {N("auto"), N("never"), N("critical")}, N("auto"))

\* The options ToTemporalZonedDateTime reads: [disambiguation, offset, overflow].
GetZonedOptions(s, options, offsetFallback) ==
  LET opts == GetOptionsObject(s, options) IN IF IsAbrupt(opts) THEN opts ELSE
  LET disambiguation == GetTemporalDisambiguationOption(opts.s, Val(opts)) IN IF IsAbrupt(disambiguation) THEN disambiguation ELSE
  LET offset == GetTemporalOffsetOption(disambiguation.s, Val(opts), offsetFallback) IN IF IsAbrupt(offset) THEN offset ELSE
  LET overflow == GetTemporalOverflowOption(offset.s, Val(opts)) IN IF IsAbrupt(overflow) THEN overflow
  ELSE Ok(overflow.s, [offset |-> Val(offset), overflow |-> Val(overflow)])

\* ToTemporalZonedDateTime, as the slots of a ZonedDateTime.
ToTemporalZonedDateTimeRecord(s, item, options) ==
  IF IsObject(item) THEN
    IF O(s, item).class = "temporalZonedDateTime" THEN
      LET read == GetZonedOptions(s, options, N("reject")) IN IF IsAbrupt(read) THEN read ELSE Ok(read.s, O(s, item).slots)
    ELSE LET calendar == GetTemporalCalendarIdentifierWithISODefault(s, item) IN IF IsAbrupt(calendar) THEN calendar ELSE
         LET fields == PrepareCalendarFields(calendar.s, item, DateFieldNames \cup CalendarTimeFieldNames \cup {"offset", "timeZone"},
                                             "time-zone") IN
         IF IsAbrupt(fields) THEN fields ELSE
         LET o == GetZonedOptions(fields.s, options, N("reject")) IN IF IsAbrupt(o) THEN o ELSE
         LET dt == InterpretTemporalDateTimeFields(o.s, Val(fields), Val(o).overflow) IN IF IsAbrupt(dt) THEN dt ELSE
         LET offsetString == Val(fields).offset
             ns == InterpretISODateTimeOffset(dt.s, Val(dt).date, Val(dt).time, IF offsetString = Empty THEN "wall" ELSE "option",
                                              IF offsetString = Empty THEN TI(0) ELSE Val(ParseDateTimeUTCOffset(dt.s, offsetString)),
                                              Val(fields).timeZone, Val(o).offset, "match-exactly")
         IN IF IsAbrupt(ns) THEN ns ELSE Ok(ns.s, [epochNs |-> Val(ns), timeZone |-> Val(fields).timeZone, calendar |-> Val(calendar)])
  ELSE IF ~IsString(item) THEN ThrowTypeError(s)
  ELSE LET parsed == ParseISODateTime(s, item.value, "zoned-date-time") IN IF IsAbrupt(parsed) THEN parsed ELSE
       LET r == Val(parsed)
           tz == ToTemporalTimeZoneIdentifier(parsed.s, Str(r.tzAnnotation))
       IN IF IsAbrupt(tz) THEN tz ELSE
       LET calendar == CanonicalizeCalendar(tz.s, IF r.calendar = Empty THEN ISO8601 ELSE r.calendar) IN IF IsAbrupt(calendar) THEN calendar ELSE
       LET o == GetZonedOptions(calendar.s, options, N("reject")) IN IF IsAbrupt(o) THEN o ELSE
       LET behaviour == CASE r.z -> "exact" [] r.offset = Empty -> "wall" [] OTHER -> "option"
           ns == InterpretISODateTimeOffset(o.s, [year |-> r.year, month |-> r.month, day |-> r.day], r.time, behaviour,
                                            IF behaviour = "option" THEN Val(ParseDateTimeUTCOffset(o.s, r.offset)) ELSE TI(0),
                                            Val(tz), Val(o).offset, IF r.offset # Empty /\ Len(r.offset) > 6 THEN "match-exactly" ELSE "match-minutes")
       IN IF IsAbrupt(ns) THEN ns ELSE Ok(ns.s, [epochNs |-> Val(ns), timeZone |-> Val(tz), calendar |-> Val(calendar)])

\* RoundEpochNanoseconds: RoundNumberToIncrementAsIfPositive.
RoundEpochNanoseconds(ns, increment, unit, mode) ==
  LET length == TIMul(TI(increment), TemporalUnitLength(unit))
      lower == TIFloorDiv(ns, length)
      remainder == TISub(ns, TIMul(lower, length))
      unsigned == UnsignedRoundingMode(mode, FALSE)
      half == TICompare(TIMul(remainder, TI(2)), length)
      rounded == CASE remainder.mag = <<>> -> lower
                   [] unsigned = "zero" -> lower
                   [] unsigned = "infinity" -> TIAdd(lower, TI(1))
                   [] half < 0 -> lower
                   [] half > 0 -> TIAdd(lower, TI(1))
                   [] unsigned = "half-zero" -> lower
                   [] unsigned = "half-infinity" -> TIAdd(lower, TI(1))
                   [] BNIsOdd(lower.mag) -> TIAdd(lower, TI(1))
                   [] OTHER -> lower
  IN TIMul(rounded, length)

\* TemporalZonedDateTimeToString.
TemporalZonedDateTimeToString(z, precision, showCalendar, showTimeZone, showOffset, increment, unit, mode) ==
  LET ns == RoundEpochNanoseconds(z.epochNs, increment, unit, mode) IN
  FormatISODateTime(GetISODateTimeFor(z.timeZone, ns), ISO8601, precision, N("never")) \o
  (IF showOffset = N("never") THEN <<>> ELSE FormatDateTimeUTCOffsetRounded(GetOffsetNanosecondsFor(z.timeZone))) \o
  (IF showTimeZone = N("never") THEN <<>> ELSE <<91>> \o (IF showTimeZone = N("critical") THEN <<33>> ELSE <<>>) \o z.timeZone.id \o <<93>>) \o
  FormatCalendarAnnotation(z.calendar, showCalendar)

\* DifferenceTemporalZonedDateTime and AddDurationToZonedDateTime.
DifferenceTemporalZonedDateTime(s, operation, z, other, options) ==
  LET o == ToTemporalZonedDateTimeRecord(s, other, Undefined) IN IF IsAbrupt(o) THEN o
  ELSE IF Val(o).calendar # z.calendar THEN ThrowError(o.s, "RangeError") ELSE
  LET opts == GetOptionsObject(o.s, options) IN IF IsAbrupt(opts) THEN opts ELSE
  LET settings == GetDifferenceSettings(opts.s, operation, Val(opts), "datetime", {}, TUNanosecond, TUHour) IN
  IF IsAbrupt(settings) THEN settings ELSE
  LET st == Val(settings) IN
  IF IsTimeUnit(st.largestUnit) THEN
    LET diff == DifferenceEpochNanoseconds(settings.s, z.epochNs, Val(o).epochNs, st.roundingIncrement, st.smallestUnit, st.roundingMode) IN
    IF IsAbrupt(diff) THEN diff
    ELSE CreateTemporalDuration(diff.s, SinceFields(operation, DurationFieldsFromInternal(Val(diff), st.largestUnit)), Empty)
  ELSE IF ~TimeZoneEquals(z.timeZone, Val(o).timeZone) THEN ThrowError(settings.s, "RangeError")
  ELSE IF z.epochNs = Val(o).epochNs THEN CreateTemporalDuration(settings.s, ZeroDurationFields, Empty)
  ELSE LET diff == DifferenceZonedDateTimeWithRounding(settings.s, z.epochNs, Val(o).epochNs, z.timeZone, st.largestUnit,
                                                       st.roundingIncrement, st.smallestUnit, st.roundingMode) IN
       IF IsAbrupt(diff) THEN diff
       ELSE CreateTemporalDuration(diff.s, SinceFields(operation, DurationFieldsFromInternal(Val(diff), TUHour)), Empty)
AddDurationToZonedDateTime(s, operation, z, durationLike, options) ==
  LET d == ToTemporalDurationFields(s, durationLike) IN IF IsAbrupt(d) THEN d ELSE
  LET opts == GetOptionsObject(d.s, options) IN IF IsAbrupt(opts) THEN opts ELSE
  LET overflow == GetTemporalOverflowOption(opts.s, Val(opts)) IN IF IsAbrupt(overflow) THEN overflow ELSE
  LET ns == AddZonedDateTime(overflow.s, z.epochNs, z.timeZone,
                             ToInternalDurationRecord(IF operation = "subtract" THEN NegatedDurationFields(Val(d)) ELSE Val(d)),
                             Val(overflow))
  IN IF IsAbrupt(ns) THEN ns ELSE CreateTemporalZonedDateTime(ns.s, Val(ns), z.timeZone, z.calendar, Empty)

\* A Number of the BigInt n.
TINumber(n) == Num(BigIntToNumber(n))

\* Temporal.ZonedDateTime.prototype.round.
RoundZonedDateTime(s, z, roundToArg) ==
  LET r == GetDayOrTimeRoundingOptions(s, roundToArg) IN IF IsAbrupt(r) THEN r ELSE
  LET o == Val(r)
      dt == GetISODateTimeFor(z.timeZone, z.epochNs)
  IN IF o.unit = TUNanosecond /\ o.increment = 1 THEN ZonedFromSlots(r.s, z)
     ELSE IF o.unit = TUDay THEN
       LET start == GetStartOfDay(r.s, z.timeZone, dt.date) IN IF IsAbrupt(start) THEN start ELSE
       LET end == GetStartOfDay(start.s, z.timeZone, AddDaysToISODate(dt.date, 1)) IN IF IsAbrupt(end) THEN end ELSE
       LET ns == IF BigIntLess(z.epochNs, Val(end)) THEN z.epochNs ELSE TISub(Val(end), TI(1))
           rounded == RoundTimeDurationToIncrement(end.s, TISub(ns, Val(start)), TISub(Val(end), Val(start)), o.mode)
       IN IF IsAbrupt(rounded) THEN rounded
          ELSE CreateTemporalZonedDateTime(rounded.s, TIAdd(Val(rounded), Val(start)), z.timeZone, z.calendar, Empty)
     ELSE LET result == RoundISODateTime(dt, o.increment, o.unit, o.mode)
              ns == InterpretISODateTimeOffset(r.s, result.date, result.time, "option", GetOffsetNanosecondsFor(z.timeZone),
                                               z.timeZone, N("prefer"), "match-exactly")
          IN IF IsAbrupt(ns) THEN ns ELSE CreateTemporalZonedDateTime(ns.s, Val(ns), z.timeZone, z.calendar, Empty)

\* Temporal.ZonedDateTime.prototype.with.
WithZonedDateTime(s, z, item, options) ==
  LET isPartial == IsPartialTemporalObject(s, item) IN IF IsAbrupt(isPartial) THEN isPartial
  ELSE IF ~Val(isPartial) THEN ThrowTypeError(isPartial.s) ELSE
  LET partial == PrepareCalendarFields(isPartial.s, item, DateFieldNames \cup CalendarTimeFieldNames \cup {"offset"}, "partial") IN
  IF IsAbrupt(partial) THEN partial ELSE
  LET dt == GetISODateTimeFor(z.timeZone, z.epochNs)
      fields == CalendarMergeFields([ISODateTimeToFields(dt) EXCEPT !.offset = FormatUTCOffsetNanoseconds(GetOffsetNanosecondsFor(z.timeZone))],
                                    Val(partial))
      o == GetZonedOptions(partial.s, options, N("prefer"))
  IN IF IsAbrupt(o) THEN o ELSE
  LET result == InterpretTemporalDateTimeFields(o.s, fields, Val(o).overflow) IN IF IsAbrupt(result) THEN result ELSE
  LET ns == InterpretISODateTimeOffset(result.s, Val(result).date, Val(result).time, "option",
                                       Val(ParseDateTimeUTCOffset(result.s, fields.offset)), z.timeZone, Val(o).offset, "match-exactly")
  IN IF IsAbrupt(ns) THEN ns ELSE CreateTemporalZonedDateTime(ns.s, Val(ns), z.timeZone, z.calendar, Empty)

\* The time zone of a ZonedDateTime constructor's argument.
ZonedConstructorTimeZone(s, v) ==
  IF ~IsString(v) THEN ThrowTypeError(s)
  ELSE LET r == ParseTimeZoneIdentifier(s, v.value) IN IF IsAbrupt(r) THEN r
  ELSE IF Val(r).offsetMinutes # Empty THEN
    Ok(r.s, [id |-> FormatOffsetTimeZoneIdentifier(Val(r).offsetMinutes, TRUE), offset |-> Val(r).offsetMinutes])
  ELSE IF TPLower(Val(r).name) = N("utc") THEN Ok(r.s, UTCTimeZone)
  ELSE ThrowError(r.s, "RangeError")

\* The epoch nanoseconds a constructor or fromEpochNanoseconds argument gives.
ToEpochNanoseconds(s, v) ==
  LET b == ToBigInt(s, v) IN IF IsAbrupt(b) THEN b
  ELSE IF IsWithinEpochNanosecondsInterval(Val(b).value) THEN Ok(b.s, Val(b).value) ELSE ThrowError(b.s, "RangeError")

ZonedDateTimeBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" ->
         IF nt = Undefined THEN ThrowTypeError(s) ELSE
         LET ns == ToEpochNanoseconds(s, Arg(args, 1)) IN IF IsAbrupt(ns) THEN ns ELSE
         LET tz == ZonedConstructorTimeZone(ns.s, Arg(args, 2)) IN IF IsAbrupt(tz) THEN tz ELSE
         LET calendarArg == IF Arg(args, 3) = Undefined THEN Str(ISO8601) ELSE Arg(args, 3) IN
         IF ~IsString(calendarArg) THEN ThrowTypeError(tz.s) ELSE
         LET calendar == CanonicalizeCalendar(tz.s, calendarArg.value) IN IF IsAbrupt(calendar) THEN calendar
         ELSE CreateTemporalZonedDateTime(calendar.s, Val(ns), Val(tz), Val(calendar), nt)
    [] m = "from" ->
         LET z == ToTemporalZonedDateTimeRecord(s, Arg(args, 1), Arg(args, 2)) IN IF IsAbrupt(z) THEN z ELSE ZonedFromSlots(z.s, Val(z))
    [] m = "compare" ->
         LET x == ToTemporalZonedDateTimeRecord(s, Arg(args, 1), Undefined) IN IF IsAbrupt(x) THEN x ELSE
         LET y == ToTemporalZonedDateTimeRecord(x.s, Arg(args, 2), Undefined) IN IF IsAbrupt(y) THEN y
         ELSE Ok(y.s, IntV(TICompare(Val(x).epochNs, Val(y).epochNs)))
    [] ~HasClass(s, this, "temporalZonedDateTime") -> ThrowTypeError(s)
    [] OTHER ->
         LET z == O(s, this).slots
             dt == GetISODateTimeFor(z.timeZone, z.epochNs)
         IN CASE m \in CalendarDateGetters -> CalendarDateGetter(s, dt.date, m)
              [] m \in {"hour", "minute", "second", "millisecond", "microsecond", "nanosecond"} -> Ok(s, IntV(dt.time[m]))
              [] m = "calendarId" -> Ok(s, Str(z.calendar))
              [] m = "timeZoneId" -> Ok(s, Str(z.timeZone.id))
              [] m = "hoursInDay" ->
                   LET today == GetStartOfDay(s, z.timeZone, dt.date) IN IF IsAbrupt(today) THEN today ELSE
                   LET tomorrow == GetStartOfDay(today.s, z.timeZone, AddDaysToISODate(dt.date, 1)) IN IF IsAbrupt(tomorrow) THEN tomorrow
                   ELSE Ok(tomorrow.s, Num(RatioToNumber(TISub(Val(tomorrow), Val(today)), TINsPerHour)))
              [] m = "epochMilliseconds" -> Ok(s, TINumber(TIFloorDiv(z.epochNs, TI(1000000))))
              [] m = "epochNanoseconds" -> Ok(s, BigInt(z.epochNs))
              [] m = "offsetNanoseconds" -> Ok(s, TINumber(GetOffsetNanosecondsFor(z.timeZone)))
              [] m = "offset" -> Ok(s, Str(FormatUTCOffsetNanoseconds(GetOffsetNanosecondsFor(z.timeZone))))
              [] m = "with" -> WithZonedDateTime(s, z, Arg(args, 1), Arg(args, 2))
              [] m = "withPlainTime" ->
                   LET ns == IF Arg(args, 1) = Undefined THEN GetStartOfDay(s, z.timeZone, dt.date)
                             ELSE LET time == ToTemporalTimeRecord(s, Arg(args, 1), Undefined) IN IF IsAbrupt(time) THEN time
                                  ELSE GetEpochNanosecondsFor(time.s, z.timeZone, [date |-> dt.date, time |-> Val(time)])
                   IN IF IsAbrupt(ns) THEN ns ELSE CreateTemporalZonedDateTime(ns.s, Val(ns), z.timeZone, z.calendar, Empty)
              [] m = "withTimeZone" ->
                   LET tz == ToTemporalTimeZoneIdentifier(s, Arg(args, 1)) IN
                   IF IsAbrupt(tz) THEN tz ELSE CreateTemporalZonedDateTime(tz.s, z.epochNs, Val(tz), z.calendar, Empty)
              [] m = "withCalendar" ->
                   LET calendar == ToTemporalCalendarIdentifier(s, Arg(args, 1)) IN
                   IF IsAbrupt(calendar) THEN calendar ELSE CreateTemporalZonedDateTime(calendar.s, z.epochNs, z.timeZone, Val(calendar), Empty)
              [] m \in {"add", "subtract"} -> AddDurationToZonedDateTime(s, m, z, Arg(args, 1), Arg(args, 2))
              [] m \in {"until", "since"} -> DifferenceTemporalZonedDateTime(s, m, z, Arg(args, 1), Arg(args, 2))
              [] m = "round" -> RoundZonedDateTime(s, z, Arg(args, 1))
              [] m = "equals" ->
                   LET other == ToTemporalZonedDateTimeRecord(s, Arg(args, 1), Undefined) IN IF IsAbrupt(other) THEN other
                   ELSE Ok(other.s, Bool(z.epochNs = Val(other).epochNs /\ TimeZoneEquals(z.timeZone, Val(other).timeZone) /\
                                         z.calendar = Val(other).calendar))
              [] m = "toString" ->
                   LET opts == GetOptionsObject(s, Arg(args, 1)) IN IF IsAbrupt(opts) THEN opts ELSE
                   LET show == GetTemporalShowCalendarNameOption(opts.s, Val(opts)) IN IF IsAbrupt(show) THEN show ELSE
                   LET digits == GetTemporalFractionalSecondDigitsOption(show.s, Val(opts)) IN IF IsAbrupt(digits) THEN digits ELSE
                   LET showOffset == GetTemporalShowOffsetOption(digits.s, Val(opts)) IN IF IsAbrupt(showOffset) THEN showOffset ELSE
                   LET mode == GetRoundingModeOption(showOffset.s, Val(opts), N("trunc")) IN IF IsAbrupt(mode) THEN mode ELSE
                   LET unit == GetTemporalUnitValuedOption(mode.s, Val(opts), SV("smallestUnit"), FALSE) IN IF IsAbrupt(unit) THEN unit ELSE
                   LET showTimeZone == GetTemporalShowTimeZoneNameOption(unit.s, Val(opts)) IN IF IsAbrupt(showTimeZone) THEN showTimeZone
                   ELSE IF ~IsValidStringUnit(Val(unit)) THEN ThrowError(showTimeZone.s, "RangeError") ELSE
                   LET precision == ToSecondsStringPrecisionRecord(Val(unit), Val(digits)) IN
                   Ok(showTimeZone.s, Str(TemporalZonedDateTimeToString(z, precision.precision, Val(show), Val(showTimeZone), Val(showOffset),
                                                                        precision.increment, precision.unit, Val(mode))))
              [] m \in {"toLocaleString", "toJSON"} ->
                   Ok(s, Str(TemporalZonedDateTimeToString(z, TPrecisionAuto, N("auto"), N("auto"), N("auto"), 1, TUNanosecond, N("trunc"))))
              [] m = "valueOf" -> ThrowTypeError(s)
              [] m = "startOfDay" ->
                   LET ns == GetStartOfDay(s, z.timeZone, dt.date) IN
                   IF IsAbrupt(ns) THEN ns ELSE CreateTemporalZonedDateTime(ns.s, Val(ns), z.timeZone, z.calendar, Empty)
              [] m = "getTimeZoneTransition" ->
                   LET param == StringOrOptionsObject(s, Arg(args, 1), SV("direction")) IN IF IsAbrupt(param) THEN param ELSE
                   LET direction == GetStringOption(param.s, Val(param), SV("direction"), {N("next"), N("previous")}, Empty) IN
                   IF IsAbrupt(direction) THEN direction
                   ELSE IF Val(direction) = Empty THEN ThrowError(direction.s, "RangeError")
                   ELSE Ok(direction.s, Null)
              [] m = "toInstant" -> CreateTemporalInstant(s, z.epochNs, Empty)
              [] m = "toPlainDate" -> CreateTemporalDate(s, dt.date, z.calendar, Empty)
              [] m = "toPlainTime" -> CreateTemporalTime(s, dt.time, Empty)
              [] m = "toPlainDateTime" -> CreateTemporalDateTime(s, dt, z.calendar, Empty)

\* Instant (Temporal §8). A Temporal.Instant has class "temporalInstant" and slots [epochNs].
CreateTemporalInstant(s, ns, newTarget) ==
  OrdinaryCreateFromConstructor(s, IF newTarget = Empty THEN Intrinsic(s, "TemporalInstant") ELSE newTarget,
                                "TemporalInstantPrototype", "temporalInstant", [epochNs |-> ns])

\* ToTemporalInstant, as epoch nanoseconds.
ToTemporalInstantNs(s, item) ==
  IF IsObject(item) /\ O(s, item).class \in {"temporalInstant", "temporalZonedDateTime"} THEN Ok(s, O(s, item).slots.epochNs) ELSE
  LET p == IF IsObject(item) THEN ToPrimitive(s, item, "string") ELSE Ok(s, item) IN IF IsAbrupt(p) THEN p
  ELSE IF ~IsString(Val(p)) THEN ThrowTypeError(p.s)
  ELSE LET parsed == ParseISODateTime(p.s, Val(p).value, "instant") IN IF IsAbrupt(parsed) THEN parsed ELSE
       LET r == Val(parsed)
           offsetNs == IF r.z THEN TI(0) ELSE Val(ParseDateTimeUTCOffset(parsed.s, r.offset))
           balanced == AddNanosecondsToISODateTime([date |-> [year |-> r.year, month |-> r.month, day |-> r.day], time |-> r.time],
                                                   TINeg(offsetNs))
           ns == GetUTCEpochNanoseconds(balanced)
       IN IF ~IsValidISODaysRange(balanced.date) \/ ~IsWithinEpochNanosecondsInterval(ns) THEN ThrowError(parsed.s, "RangeError")
          ELSE Ok(parsed.s, ns)

\* TemporalInstantToString, for a time zone or Empty.
TemporalInstantToString(ns, tz, precision) ==
  FormatISODateTime(GetISODateTimeFor(IF tz = Empty THEN UTCTimeZone ELSE tz, ns), ISO8601, precision, N("never")) \o
  (IF tz = Empty THEN <<90>> ELSE FormatDateTimeUTCOffsetRounded(GetOffsetNanosecondsFor(tz)))

\* DifferenceTemporalInstant and AddDurationToInstant.
DifferenceTemporalInstant(s, operation, ns, other, options) ==
  LET o == ToTemporalInstantNs(s, other) IN IF IsAbrupt(o) THEN o ELSE
  LET opts == GetOptionsObject(o.s, options) IN IF IsAbrupt(opts) THEN opts ELSE
  LET settings == GetDifferenceSettings(opts.s, operation, Val(opts), "time", {}, TUNanosecond, TUSecond) IN
  IF IsAbrupt(settings) THEN settings ELSE
  LET st == Val(settings)
      diff == DifferenceEpochNanoseconds(settings.s, ns, Val(o), st.roundingIncrement, st.smallestUnit, st.roundingMode)
  IN IF IsAbrupt(diff) THEN diff
     ELSE CreateTemporalDuration(diff.s, SinceFields(operation, DurationFieldsFromInternal(Val(diff), st.largestUnit)), Empty)
AddDurationToInstant(s, operation, ns, durationLike) ==
  LET d == ToTemporalDurationFields(s, durationLike) IN IF IsAbrupt(d) THEN d ELSE
  LET duration == IF operation = "subtract" THEN NegatedDurationFields(Val(d)) ELSE Val(d) IN
  IF IsDateUnit(DefaultTemporalLargestUnit(duration)) THEN ThrowError(d.s, "RangeError") ELSE
  LET r == AddEpochNanoseconds(d.s, ns, ToInternalDurationRecordWith24HourDays(duration).time) IN
  IF IsAbrupt(r) THEN r ELSE CreateTemporalInstant(r.s, Val(r), Empty)

InstantBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" ->
         IF nt = Undefined THEN ThrowTypeError(s) ELSE
         LET ns == ToEpochNanoseconds(s, Arg(args, 1)) IN IF IsAbrupt(ns) THEN ns ELSE CreateTemporalInstant(ns.s, Val(ns), nt)
    [] m = "from" -> LET ns == ToTemporalInstantNs(s, Arg(args, 1)) IN IF IsAbrupt(ns) THEN ns ELSE CreateTemporalInstant(ns.s, Val(ns), Empty)
    [] m = "fromEpochMilliseconds" ->
         LET ms == SnapToInteger(s, Arg(args, 1), FALSE) IN IF IsAbrupt(ms) THEN ms
         ELSE IF BigIntLess(BigIntDiv(TINsMaxInstant, TI(1000000)), TIAbs(Val(ms))) THEN ThrowError(ms.s, "RangeError")
         ELSE CreateTemporalInstant(ms.s, TIMul(Val(ms), TI(1000000)), Empty)
    [] m = "fromEpochNanoseconds" ->
         LET ns == ToEpochNanoseconds(s, Arg(args, 1)) IN IF IsAbrupt(ns) THEN ns ELSE CreateTemporalInstant(ns.s, Val(ns), Empty)
    [] m = "compare" ->
         LET x == ToTemporalInstantNs(s, Arg(args, 1)) IN IF IsAbrupt(x) THEN x ELSE
         LET y == ToTemporalInstantNs(x.s, Arg(args, 2)) IN IF IsAbrupt(y) THEN y ELSE Ok(y.s, IntV(TICompare(Val(x), Val(y))))
    [] ~HasClass(s, this, "temporalInstant") -> ThrowTypeError(s)
    [] OTHER ->
         LET ns == O(s, this).slots.epochNs IN
         CASE m = "epochMilliseconds" -> Ok(s, TINumber(TIFloorDiv(ns, TI(1000000))))
           [] m = "epochNanoseconds" -> Ok(s, BigInt(ns))
           [] m \in {"add", "subtract"} -> AddDurationToInstant(s, m, ns, Arg(args, 1))
           [] m \in {"until", "since"} -> DifferenceTemporalInstant(s, m, ns, Arg(args, 1), Arg(args, 2))
           [] m = "round" ->
                LET roundTo == StringOrOptionsObject(s, Arg(args, 1), SV("smallestUnit")) IN IF IsAbrupt(roundTo) THEN roundTo ELSE
                LET increment == GetRoundingIncrementOption(roundTo.s, Val(roundTo)) IN IF IsAbrupt(increment) THEN increment ELSE
                LET mode == GetRoundingModeOption(increment.s, Val(roundTo), N("halfExpand")) IN IF IsAbrupt(mode) THEN mode ELSE
                LET unit == GetTemporalUnitValuedOption(mode.s, Val(roundTo), SV("smallestUnit"), TRUE) IN IF IsAbrupt(unit) THEN unit
                ELSE IF ~IsValidUnitValue(Val(unit), "time", {}) \/
                        ~IsValidRoundingIncrement(Val(increment), BigIntDiv(TINsPerDay, TemporalUnitLength(Val(unit))), TRUE)
                THEN ThrowError(unit.s, "RangeError")
                ELSE CreateTemporalInstant(unit.s, RoundEpochNanoseconds(ns, Val(increment), Val(unit), Val(mode)), Empty)
           [] m = "equals" ->
                LET other == ToTemporalInstantNs(s, Arg(args, 1)) IN IF IsAbrupt(other) THEN other ELSE Ok(other.s, Bool(ns = Val(other)))
           [] m = "toString" ->
                LET opts == GetOptionsObject(s, Arg(args, 1)) IN IF IsAbrupt(opts) THEN opts ELSE
                LET o == GetTimeStringOptions(opts.s, Val(opts)) IN IF IsAbrupt(o) THEN o ELSE
                LET tzLike == Get(o.s, Val(opts), SV("timeZone")) IN IF IsAbrupt(tzLike) THEN tzLike
                ELSE IF ~IsValidStringUnit(Val(o).unit) THEN ThrowError(tzLike.s, "RangeError") ELSE
                LET tz == IF Val(tzLike) = Undefined THEN Ok(tzLike.s, Empty) ELSE ToTemporalTimeZoneIdentifier(tzLike.s, Val(tzLike)) IN
                IF IsAbrupt(tz) THEN tz ELSE
                LET precision == ToSecondsStringPrecisionRecord(Val(o).unit, Val(o).digits) IN
                Ok(tz.s, Str(TemporalInstantToString(RoundEpochNanoseconds(ns, precision.increment, precision.unit, Val(o).mode),
                                                     Val(tz), precision.precision)))
           [] m \in {"toLocaleString", "toJSON"} -> Ok(s, Str(TemporalInstantToString(ns, Empty, TPrecisionAuto)))
           [] m = "valueOf" -> ThrowTypeError(s)
           [] m = "toZonedDateTimeISO" ->
                LET tz == ToTemporalTimeZoneIdentifier(s, Arg(args, 1)) IN
                IF IsAbrupt(tz) THEN tz ELSE CreateTemporalZonedDateTime(tz.s, ns, Val(tz), ISO8601, Empty)

\* PlainYearMonth (Temporal §9). A Temporal.PlainYearMonth has class "temporalYearMonth" and slots
\* [date, calendar], with a reference day.
CreateTemporalYearMonth(s, date, calendar, newTarget) ==
  IF ~ISOYearMonthWithinLimits(date) THEN ThrowError(s, "RangeError")
  ELSE OrdinaryCreateFromConstructor(s, IF newTarget = Empty THEN Intrinsic(s, "TemporalPlainYearMonth") ELSE newTarget,
                                     "TemporalPlainYearMonthPrototype", "temporalYearMonth", [date |-> date, calendar |-> calendar])

\* ToTemporalYearMonth, as [date, calendar].
ToTemporalYearMonthRecord(s, item, options) ==
  IF IsObject(item) THEN
    IF O(s, item).class = "temporalYearMonth" THEN
      LET read == ReadOverflowOption(s, options) IN IF IsAbrupt(read) THEN read ELSE Ok(read.s, O(s, item).slots)
    ELSE LET calendar == GetTemporalCalendarIdentifierWithISODefault(s, item) IN IF IsAbrupt(calendar) THEN calendar ELSE
         LET fields == PrepareCalendarFields(calendar.s, item, YearMonthFieldNames, "no-required-fields") IN IF IsAbrupt(fields) THEN fields ELSE
         LET opts == GetOptionsObject(fields.s, options) IN IF IsAbrupt(opts) THEN opts ELSE
         LET overflow == GetTemporalOverflowOption(opts.s, Val(opts)) IN IF IsAbrupt(overflow) THEN overflow ELSE
         LET date == CalendarYearMonthFromFields(overflow.s, Val(fields), Val(overflow)) IN
         IF IsAbrupt(date) THEN date ELSE Ok(date.s, [date |-> Val(date), calendar |-> Val(calendar)])
  ELSE IF ~IsString(item) THEN ThrowTypeError(s)
  ELSE LET parsed == ParseISODateTime(s, item.value, "year-month") IN IF IsAbrupt(parsed) THEN parsed ELSE
       LET r == Val(parsed)
           calendar == CanonicalizeCalendar(parsed.s, IF r.calendar = Empty THEN ISO8601 ELSE r.calendar)
       IN IF IsAbrupt(calendar) THEN calendar ELSE
       LET read == ReadOverflowOption(calendar.s, options) IN IF IsAbrupt(read) THEN read
       ELSE IF ~ISOYearMonthWithinLimits([year |-> r.year, month |-> r.month, day |-> r.day]) THEN ThrowError(read.s, "RangeError")
       ELSE LET date == CalendarYearMonthFromFields(read.s, ISODateToFields([year |-> r.year, month |-> r.month, day |-> r.day], "year-month"),
                                                    N("constrain")) IN
            IF IsAbrupt(date) THEN date ELSE Ok(date.s, [date |-> Val(date), calendar |-> Val(calendar)])

\* TemporalYearMonthToString and TemporalMonthDayToString.
TemporalYearMonthToString(ym, show) ==
  PadISOYear(ym.date.year) \o <<45>> \o TwoDigits(ym.date.month) \o
  (IF show \in {N("always"), N("critical")} \/ ym.calendar # ISO8601 THEN <<45>> \o TwoDigits(ym.date.day) ELSE <<>>) \o
  FormatCalendarAnnotation(ym.calendar, show)
TemporalMonthDayToString(md, show) ==
  (IF show \in {N("always"), N("critical")} \/ md.calendar # ISO8601 THEN PadISOYear(md.date.year) \o <<45>> ELSE <<>>) \o
  TwoDigits(md.date.month) \o <<45>> \o TwoDigits(md.date.day) \o FormatCalendarAnnotation(md.calendar, show)

\* The first day of a year-month, as CalendarDateFromFields gives it.
YearMonthFirstDay(s, date) == CalendarDateFromFields(s, [ISODateToFields(date, "year-month") EXCEPT !.day = TI(1)], N("constrain"))

\* DifferenceTemporalPlainYearMonth and AddDurationToYearMonth.
DifferenceTemporalPlainYearMonth(s, operation, ym, other, options) ==
  LET o == ToTemporalYearMonthRecord(s, other, Undefined) IN IF IsAbrupt(o) THEN o
  ELSE IF Val(o).calendar # ym.calendar THEN ThrowError(o.s, "RangeError") ELSE
  LET opts == GetOptionsObject(o.s, options) IN IF IsAbrupt(opts) THEN opts ELSE
  LET settings == GetDifferenceSettings(opts.s, operation, Val(opts), "date", {TUWeek, TUDay}, TUMonth, TUYear) IN
  IF IsAbrupt(settings) THEN settings
  ELSE IF CompareISODate(ym.date, Val(o).date) = 0 THEN CreateTemporalDuration(settings.s, ZeroDurationFields, Empty) ELSE
  LET thisDate == YearMonthFirstDay(settings.s, ym.date) IN IF IsAbrupt(thisDate) THEN thisDate ELSE
  LET otherDate == YearMonthFirstDay(thisDate.s, Val(o).date) IN IF IsAbrupt(otherDate) THEN otherDate ELSE
  LET st == Val(settings)
      until == CalendarDateUntil(Val(thisDate), Val(otherDate), st.largestUnit)
      duration == CombineDateAndTimeDuration(<<until[1], until[2], TI(0), TI(0)>>, TI(0))
      from == [date |-> Val(thisDate), time |-> MidnightTimeRecord]
      rounded == IF st.smallestUnit = TUMonth /\ st.roundingIncrement = 1 THEN Ok(otherDate.s, duration)
                 ELSE RoundRelativeDuration(otherDate.s, duration, GetUTCEpochNanoseconds(from),
                                            GetUTCEpochNanoseconds([date |-> Val(otherDate), time |-> MidnightTimeRecord]), from, Empty,
                                            st.largestUnit, st.roundingIncrement, st.smallestUnit, st.roundingMode)
  IN IF IsAbrupt(rounded) THEN rounded
     ELSE CreateTemporalDuration(rounded.s, SinceFields(operation, DurationFieldsFromInternal(Val(rounded), TUDay)), Empty)
AddDurationToYearMonth(s, operation, ym, durationLike, options) ==
  LET d == ToTemporalDurationFields(s, durationLike) IN IF IsAbrupt(d) THEN d ELSE
  LET internal == ToInternalDurationRecord(IF operation = "subtract" THEN NegatedDurationFields(Val(d)) ELSE Val(d))
      opts == GetOptionsObject(d.s, options)
  IN IF IsAbrupt(opts) THEN opts ELSE
  LET overflow == GetTemporalOverflowOption(opts.s, Val(opts)) IN IF IsAbrupt(overflow) THEN overflow
  ELSE IF internal.date[3].mag # <<>> \/ internal.date[4].mag # <<>> \/ internal.time.mag # <<>> THEN ThrowError(overflow.s, "RangeError") ELSE
  LET date == YearMonthFirstDay(overflow.s, ym.date) IN IF IsAbrupt(date) THEN date ELSE
  LET added == CalendarDateAdd(date.s, Val(date), internal.date, Val(overflow)) IN IF IsAbrupt(added) THEN added ELSE
  LET result == CalendarYearMonthFromFields(added.s, ISODateToFields(Val(added), "year-month"), Val(overflow)) IN
  IF IsAbrupt(result) THEN result ELSE CreateTemporalYearMonth(result.s, Val(result), ym.calendar, Empty)

\* The getters of PlainYearMonth.
YearMonthGetters == {"era", "eraYear", "year", "month", "monthCode", "daysInYear", "daysInMonth", "monthsInYear", "inLeapYear"}

\* The with of PlainYearMonth and PlainMonthDay: the merged fields of a partial object.
MergedPartialFields(s, fields, item, names) ==
  LET isPartial == IsPartialTemporalObject(s, item) IN IF IsAbrupt(isPartial) THEN isPartial
  ELSE IF ~Val(isPartial) THEN ThrowTypeError(isPartial.s) ELSE
  LET partial == PrepareCalendarFields(isPartial.s, item, names, "partial") IN
  IF IsAbrupt(partial) THEN partial ELSE Ok(partial.s, CalendarMergeFields(fields, Val(partial)))

\* The toPlainDate of PlainYearMonth and PlainMonthDay: the date of the fields merged with the
\* named fields of an object.
MergedPlainDate(s, fields, item, names, calendar) ==
  IF ~IsObject(item) THEN ThrowTypeError(s) ELSE
  LET input == PrepareCalendarFields(s, item, names, "no-required-fields") IN IF IsAbrupt(input) THEN input ELSE
  LET date == CalendarDateFromFields(input.s, CalendarMergeFields(fields, Val(input)), N("constrain")) IN
  IF IsAbrupt(date) THEN date ELSE CreateTemporalDate(date.s, Val(date), calendar, Empty)

PlainYearMonthBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" ->
         IF nt = Undefined THEN ThrowTypeError(s) ELSE
         LET year == SnapToInteger(s, Arg(args, 1), TRUE) IN IF IsAbrupt(year) THEN year ELSE
         LET month == SnapToInteger(year.s, Arg(args, 2), TRUE) IN IF IsAbrupt(month) THEN month ELSE
         LET calendarArg == IF Arg(args, 3) = Undefined THEN Str(ISO8601) ELSE Arg(args, 3) IN
         IF ~IsString(calendarArg) THEN ThrowTypeError(month.s) ELSE
         LET calendar == CanonicalizeCalendar(month.s, calendarArg.value) IN IF IsAbrupt(calendar) THEN calendar ELSE
         LET day == IF Arg(args, 4) = Undefined THEN Ok(calendar.s, TI(1)) ELSE SnapToInteger(calendar.s, Arg(args, 4), TRUE) IN
         IF IsAbrupt(day) THEN day
         ELSE IF ~TIYearInRange(Val(year)) THEN ThrowError(day.s, "RangeError") ELSE
         LET date == RegulateISODate(day.s, TIToInt(Val(year)), Val(month), Val(day), N("reject")) IN
         IF IsAbrupt(date) THEN date ELSE CreateTemporalYearMonth(date.s, Val(date), Val(calendar), nt)
    [] m = "from" ->
         LET r == ToTemporalYearMonthRecord(s, Arg(args, 1), Arg(args, 2)) IN
         IF IsAbrupt(r) THEN r ELSE CreateTemporalYearMonth(r.s, Val(r).date, Val(r).calendar, Empty)
    [] m = "compare" ->
         LET x == ToTemporalYearMonthRecord(s, Arg(args, 1), Undefined) IN IF IsAbrupt(x) THEN x ELSE
         LET y == ToTemporalYearMonthRecord(x.s, Arg(args, 2), Undefined) IN IF IsAbrupt(y) THEN y
         ELSE Ok(y.s, IntV(CompareISODate(Val(x).date, Val(y).date)))
    [] ~HasClass(s, this, "temporalYearMonth") -> ThrowTypeError(s)
    [] OTHER ->
         LET ym == O(s, this).slots IN
         CASE m \in YearMonthGetters -> CalendarDateGetter(s, ym.date, m)
           [] m = "calendarId" -> Ok(s, Str(ym.calendar))
           [] m = "with" ->
                LET fields == MergedPartialFields(s, ISODateToFields(ym.date, "year-month"), Arg(args, 1), YearMonthFieldNames) IN
                IF IsAbrupt(fields) THEN fields ELSE
                LET opts == GetOptionsObject(fields.s, Arg(args, 2)) IN IF IsAbrupt(opts) THEN opts ELSE
                LET overflow == GetTemporalOverflowOption(opts.s, Val(opts)) IN IF IsAbrupt(overflow) THEN overflow ELSE
                LET date == CalendarYearMonthFromFields(overflow.s, Val(fields), Val(overflow)) IN
                IF IsAbrupt(date) THEN date ELSE CreateTemporalYearMonth(date.s, Val(date), ym.calendar, Empty)
           [] m \in {"add", "subtract"} -> AddDurationToYearMonth(s, m, ym, Arg(args, 1), Arg(args, 2))
           [] m \in {"until", "since"} -> DifferenceTemporalPlainYearMonth(s, m, ym, Arg(args, 1), Arg(args, 2))
           [] m = "equals" ->
                LET other == ToTemporalYearMonthRecord(s, Arg(args, 1), Undefined) IN IF IsAbrupt(other) THEN other
                ELSE Ok(other.s, Bool(CompareISODate(ym.date, Val(other).date) = 0 /\ ym.calendar = Val(other).calendar))
           [] m = "toString" ->
                LET opts == GetOptionsObject(s, Arg(args, 1)) IN IF IsAbrupt(opts) THEN opts ELSE
                LET show == GetTemporalShowCalendarNameOption(opts.s, Val(opts)) IN IF IsAbrupt(show) THEN show
                ELSE Ok(show.s, Str(TemporalYearMonthToString(ym, Val(show))))
           [] m \in {"toLocaleString", "toJSON"} -> Ok(s, Str(TemporalYearMonthToString(ym, N("auto"))))
           [] m = "valueOf" -> ThrowTypeError(s)
           [] m = "toPlainDate" -> MergedPlainDate(s, ISODateToFields(ym.date, "year-month"), Arg(args, 1), {"day"}, ym.calendar)

\* PlainMonthDay (Temporal §10). A Temporal.PlainMonthDay has class "temporalMonthDay" and slots
\* [date, calendar], with a reference year.
CreateTemporalMonthDay(s, date, calendar, newTarget) ==
  IF ~ISODateWithinLimits(date) THEN ThrowError(s, "RangeError")
  ELSE OrdinaryCreateFromConstructor(s, IF newTarget = Empty THEN Intrinsic(s, "TemporalPlainMonthDay") ELSE newTarget,
                                     "TemporalPlainMonthDayPrototype", "temporalMonthDay", [date |-> date, calendar |-> calendar])

\* ToTemporalMonthDay, as [date, calendar].
ToTemporalMonthDayRecord(s, item, options) ==
  IF IsObject(item) THEN
    IF O(s, item).class = "temporalMonthDay" THEN
      LET read == ReadOverflowOption(s, options) IN IF IsAbrupt(read) THEN read ELSE Ok(read.s, O(s, item).slots)
    ELSE LET calendar == GetTemporalCalendarIdentifierWithISODefault(s, item) IN IF IsAbrupt(calendar) THEN calendar ELSE
         LET fields == PrepareCalendarFields(calendar.s, item, DateFieldNames, "no-required-fields") IN IF IsAbrupt(fields) THEN fields ELSE
         LET opts == GetOptionsObject(fields.s, options) IN IF IsAbrupt(opts) THEN opts ELSE
         LET overflow == GetTemporalOverflowOption(opts.s, Val(opts)) IN IF IsAbrupt(overflow) THEN overflow ELSE
         LET date == CalendarMonthDayFromFields(overflow.s, Val(fields), Val(overflow)) IN
         IF IsAbrupt(date) THEN date ELSE Ok(date.s, [date |-> Val(date), calendar |-> Val(calendar)])
  ELSE IF ~IsString(item) THEN ThrowTypeError(s)
  ELSE LET parsed == ParseISODateTime(s, item.value, "month-day") IN IF IsAbrupt(parsed) THEN parsed ELSE
       LET r == Val(parsed)
           calendar == CanonicalizeCalendar(parsed.s, IF r.calendar = Empty THEN ISO8601 ELSE r.calendar)
       IN IF IsAbrupt(calendar) THEN calendar ELSE
       LET read == ReadOverflowOption(calendar.s, options) IN IF IsAbrupt(read) THEN read
       ELSE Ok(read.s, [date |-> [year |-> 1972, month |-> r.month, day |-> r.day], calendar |-> Val(calendar)])

PlainMonthDayBuiltin(s, f, m, this, args, nt) ==
  CASE m = "constructor" ->
         IF nt = Undefined THEN ThrowTypeError(s) ELSE
         LET month == SnapToInteger(s, Arg(args, 1), TRUE) IN IF IsAbrupt(month) THEN month ELSE
         LET day == SnapToInteger(month.s, Arg(args, 2), TRUE) IN IF IsAbrupt(day) THEN day ELSE
         LET calendarArg == IF Arg(args, 3) = Undefined THEN Str(ISO8601) ELSE Arg(args, 3) IN
         IF ~IsString(calendarArg) THEN ThrowTypeError(day.s) ELSE
         LET calendar == CanonicalizeCalendar(day.s, calendarArg.value) IN IF IsAbrupt(calendar) THEN calendar ELSE
         LET year == IF Arg(args, 4) = Undefined THEN Ok(calendar.s, TI(1972)) ELSE SnapToInteger(calendar.s, Arg(args, 4), TRUE) IN
         IF IsAbrupt(year) THEN year
         ELSE IF ~TIYearInRange(Val(year)) THEN ThrowError(year.s, "RangeError") ELSE
         LET date == RegulateISODate(year.s, TIToInt(Val(year)), Val(month), Val(day), N("reject")) IN
         IF IsAbrupt(date) THEN date ELSE CreateTemporalMonthDay(date.s, Val(date), Val(calendar), nt)
    [] m = "from" ->
         LET r == ToTemporalMonthDayRecord(s, Arg(args, 1), Arg(args, 2)) IN
         IF IsAbrupt(r) THEN r ELSE CreateTemporalMonthDay(r.s, Val(r).date, Val(r).calendar, Empty)
    [] ~HasClass(s, this, "temporalMonthDay") -> ThrowTypeError(s)
    [] OTHER ->
         LET md == O(s, this).slots IN
         CASE m \in {"monthCode", "day"} -> CalendarDateGetter(s, md.date, m)
           [] m = "calendarId" -> Ok(s, Str(md.calendar))
           [] m = "with" ->
                LET fields == MergedPartialFields(s, ISODateToFields(md.date, "month-day"), Arg(args, 1), DateFieldNames) IN
                IF IsAbrupt(fields) THEN fields ELSE
                LET opts == GetOptionsObject(fields.s, Arg(args, 2)) IN IF IsAbrupt(opts) THEN opts ELSE
                LET overflow == GetTemporalOverflowOption(opts.s, Val(opts)) IN IF IsAbrupt(overflow) THEN overflow ELSE
                LET date == CalendarMonthDayFromFields(overflow.s, Val(fields), Val(overflow)) IN
                IF IsAbrupt(date) THEN date ELSE CreateTemporalMonthDay(date.s, Val(date), md.calendar, Empty)
           [] m = "equals" ->
                LET other == ToTemporalMonthDayRecord(s, Arg(args, 1), Undefined) IN IF IsAbrupt(other) THEN other
                ELSE Ok(other.s, Bool(CompareISODate(md.date, Val(other).date) = 0 /\ md.calendar = Val(other).calendar))
           [] m = "toString" ->
                LET opts == GetOptionsObject(s, Arg(args, 1)) IN IF IsAbrupt(opts) THEN opts ELSE
                LET show == GetTemporalShowCalendarNameOption(opts.s, Val(opts)) IN IF IsAbrupt(show) THEN show
                ELSE Ok(show.s, Str(TemporalMonthDayToString(md, Val(show))))
           [] m \in {"toLocaleString", "toJSON"} -> Ok(s, Str(TemporalMonthDayToString(md, N("auto"))))
           [] m = "valueOf" -> ThrowTypeError(s)
           [] m = "toPlainDate" -> MergedPlainDate(s, ISODateToFields(md.date, "month-day"), Arg(args, 1), {"year"}, md.calendar)

\* Temporal.Now (Temporal §2). The system time zone is UTC, and the system time is the clock Date
\* reads, in milliseconds.
SystemUTCEpochNanoseconds(s) == TIMul(TI(s.clock), TI(1000000))
SystemDateTime(s, tzLike) ==
  LET tz == IF tzLike = Undefined THEN Ok(s, UTCTimeZone) ELSE ToTemporalTimeZoneIdentifier(s, tzLike) IN
  IF IsAbrupt(tz) THEN tz ELSE Ok(Tick(tz.s), GetISODateTimeFor(Val(tz), SystemUTCEpochNanoseconds(tz.s)))

TemporalNowBuiltin(s, f, m, this, args, nt) ==
  CASE m = "timeZoneId" -> Ok(s, Str(UTCTimeZone.id))
    [] m = "instant" -> CreateTemporalInstant(Tick(s), SystemUTCEpochNanoseconds(s), Empty)
    [] m = "zonedDateTimeISO" ->
         LET tz == IF Arg(args, 1) = Undefined THEN Ok(s, UTCTimeZone) ELSE ToTemporalTimeZoneIdentifier(s, Arg(args, 1)) IN
         IF IsAbrupt(tz) THEN tz ELSE CreateTemporalZonedDateTime(Tick(tz.s), SystemUTCEpochNanoseconds(tz.s), Val(tz), ISO8601, Empty)
    [] OTHER ->
         LET dt == SystemDateTime(s, Arg(args, 1)) IN
         IF IsAbrupt(dt) THEN dt
         ELSE CASE m = "plainDateTimeISO" -> CreateTemporalDateTime(dt.s, Val(dt), ISO8601, Empty)
                [] m = "plainDateISO" -> CreateTemporalDate(dt.s, Val(dt).date, ISO8601, Empty)
                [] m = "plainTimeISO" -> CreateTemporalTime(dt.s, Val(dt).time, Empty)

TemporalTypesIntrinsics ==
  << IntrinsicObject("TemporalPlainDatePrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("TemporalPlainDate", "FunctionPrototype", <<"PlainDate", "constructor">>, 3, N("PlainDate"), TRUE),
     IntrinsicObject("TemporalPlainDateTimePrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("TemporalPlainDateTime", "FunctionPrototype", <<"PlainDateTime", "constructor">>, 3, N("PlainDateTime"), TRUE),
     IntrinsicObject("TemporalZonedDateTimePrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("TemporalZonedDateTime", "FunctionPrototype", <<"ZonedDateTime", "constructor">>, 2, N("ZonedDateTime"), TRUE),
     IntrinsicObject("TemporalInstantPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("TemporalInstant", "FunctionPrototype", <<"Instant", "constructor">>, 1, N("Instant"), TRUE),
     IntrinsicObject("TemporalPlainYearMonthPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("TemporalPlainYearMonth", "FunctionPrototype", <<"PlainYearMonth", "constructor">>, 2, N("PlainYearMonth"), TRUE),
     IntrinsicObject("TemporalPlainMonthDayPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("TemporalPlainMonthDay", "FunctionPrototype", <<"PlainMonthDay", "constructor">>, 2, N("PlainMonthDay"), TRUE),
     IntrinsicObject("TemporalNow", "ObjectPrototype", "ordinary", [none |-> TRUE]) >>

TemporalTypesProperties ==
  Ctor("TemporalPlainDate", "TemporalPlainDatePrototype") \o
  Ctor("TemporalPlainDateTime", "TemporalPlainDateTimePrototype") \o
  Ctor("TemporalZonedDateTime", "TemporalZonedDateTimePrototype") \o
  Ctor("TemporalInstant", "TemporalInstantPrototype") \o
  Ctor("TemporalPlainYearMonth", "TemporalPlainYearMonthPrototype") \o
  Ctor("TemporalPlainMonthDay", "TemporalPlainMonthDayPrototype") \o
  << \* PlainDate.
     M("TemporalPlainDate", SV("from"), "PlainDate", "from", 1),
     M("TemporalPlainDate", SV("compare"), "PlainDate", "compare", 2),
     G("TemporalPlainDatePrototype", SV("calendarId"), "PlainDate", "calendarId", ""),
     G("TemporalPlainDatePrototype", SV("era"), "PlainDate", "era", ""),
     G("TemporalPlainDatePrototype", SV("eraYear"), "PlainDate", "eraYear", ""),
     G("TemporalPlainDatePrototype", SV("year"), "PlainDate", "year", ""),
     G("TemporalPlainDatePrototype", SV("month"), "PlainDate", "month", ""),
     G("TemporalPlainDatePrototype", SV("monthCode"), "PlainDate", "monthCode", ""),
     G("TemporalPlainDatePrototype", SV("day"), "PlainDate", "day", ""),
     G("TemporalPlainDatePrototype", SV("dayOfWeek"), "PlainDate", "dayOfWeek", ""),
     G("TemporalPlainDatePrototype", SV("dayOfYear"), "PlainDate", "dayOfYear", ""),
     G("TemporalPlainDatePrototype", SV("weekOfYear"), "PlainDate", "weekOfYear", ""),
     G("TemporalPlainDatePrototype", SV("yearOfWeek"), "PlainDate", "yearOfWeek", ""),
     G("TemporalPlainDatePrototype", SV("daysInWeek"), "PlainDate", "daysInWeek", ""),
     G("TemporalPlainDatePrototype", SV("daysInMonth"), "PlainDate", "daysInMonth", ""),
     G("TemporalPlainDatePrototype", SV("daysInYear"), "PlainDate", "daysInYear", ""),
     G("TemporalPlainDatePrototype", SV("monthsInYear"), "PlainDate", "monthsInYear", ""),
     G("TemporalPlainDatePrototype", SV("inLeapYear"), "PlainDate", "inLeapYear", ""),
     M("TemporalPlainDatePrototype", SV("toPlainYearMonth"), "PlainDate", "toPlainYearMonth", 0),
     M("TemporalPlainDatePrototype", SV("toPlainMonthDay"), "PlainDate", "toPlainMonthDay", 0),
     M("TemporalPlainDatePrototype", SV("add"), "PlainDate", "add", 1),
     M("TemporalPlainDatePrototype", SV("subtract"), "PlainDate", "subtract", 1),
     M("TemporalPlainDatePrototype", SV("with"), "PlainDate", "with", 1),
     M("TemporalPlainDatePrototype", SV("withCalendar"), "PlainDate", "withCalendar", 1),
     M("TemporalPlainDatePrototype", SV("until"), "PlainDate", "until", 1),
     M("TemporalPlainDatePrototype", SV("since"), "PlainDate", "since", 1),
     M("TemporalPlainDatePrototype", SV("equals"), "PlainDate", "equals", 1),
     M("TemporalPlainDatePrototype", SV("toPlainDateTime"), "PlainDate", "toPlainDateTime", 0),
     M("TemporalPlainDatePrototype", SV("toZonedDateTime"), "PlainDate", "toZonedDateTime", 1),
     M("TemporalPlainDatePrototype", SV("toString"), "PlainDate", "toString", 0),
     M("TemporalPlainDatePrototype", SV("toLocaleString"), "PlainDate", "toLocaleString", 0),
     M("TemporalPlainDatePrototype", SV("toJSON"), "PlainDate", "toJSON", 0),
     M("TemporalPlainDatePrototype", SV("valueOf"), "PlainDate", "valueOf", 0),
     V("TemporalPlainDatePrototype", SymToStringTag, SV("Temporal.PlainDate"), FALSE, FALSE, TRUE),
     \* PlainDateTime.
     M("TemporalPlainDateTime", SV("from"), "PlainDateTime", "from", 1),
     M("TemporalPlainDateTime", SV("compare"), "PlainDateTime", "compare", 2),
     G("TemporalPlainDateTimePrototype", SV("calendarId"), "PlainDateTime", "calendarId", ""),
     G("TemporalPlainDateTimePrototype", SV("era"), "PlainDateTime", "era", ""),
     G("TemporalPlainDateTimePrototype", SV("eraYear"), "PlainDateTime", "eraYear", ""),
     G("TemporalPlainDateTimePrototype", SV("year"), "PlainDateTime", "year", ""),
     G("TemporalPlainDateTimePrototype", SV("month"), "PlainDateTime", "month", ""),
     G("TemporalPlainDateTimePrototype", SV("monthCode"), "PlainDateTime", "monthCode", ""),
     G("TemporalPlainDateTimePrototype", SV("day"), "PlainDateTime", "day", ""),
     G("TemporalPlainDateTimePrototype", SV("hour"), "PlainDateTime", "hour", ""),
     G("TemporalPlainDateTimePrototype", SV("minute"), "PlainDateTime", "minute", ""),
     G("TemporalPlainDateTimePrototype", SV("second"), "PlainDateTime", "second", ""),
     G("TemporalPlainDateTimePrototype", SV("millisecond"), "PlainDateTime", "millisecond", ""),
     G("TemporalPlainDateTimePrototype", SV("microsecond"), "PlainDateTime", "microsecond", ""),
     G("TemporalPlainDateTimePrototype", SV("nanosecond"), "PlainDateTime", "nanosecond", ""),
     G("TemporalPlainDateTimePrototype", SV("dayOfWeek"), "PlainDateTime", "dayOfWeek", ""),
     G("TemporalPlainDateTimePrototype", SV("dayOfYear"), "PlainDateTime", "dayOfYear", ""),
     G("TemporalPlainDateTimePrototype", SV("weekOfYear"), "PlainDateTime", "weekOfYear", ""),
     G("TemporalPlainDateTimePrototype", SV("yearOfWeek"), "PlainDateTime", "yearOfWeek", ""),
     G("TemporalPlainDateTimePrototype", SV("daysInWeek"), "PlainDateTime", "daysInWeek", ""),
     G("TemporalPlainDateTimePrototype", SV("daysInMonth"), "PlainDateTime", "daysInMonth", ""),
     G("TemporalPlainDateTimePrototype", SV("daysInYear"), "PlainDateTime", "daysInYear", ""),
     G("TemporalPlainDateTimePrototype", SV("monthsInYear"), "PlainDateTime", "monthsInYear", ""),
     G("TemporalPlainDateTimePrototype", SV("inLeapYear"), "PlainDateTime", "inLeapYear", ""),
     M("TemporalPlainDateTimePrototype", SV("with"), "PlainDateTime", "with", 1),
     M("TemporalPlainDateTimePrototype", SV("withPlainTime"), "PlainDateTime", "withPlainTime", 0),
     M("TemporalPlainDateTimePrototype", SV("withCalendar"), "PlainDateTime", "withCalendar", 1),
     M("TemporalPlainDateTimePrototype", SV("add"), "PlainDateTime", "add", 1),
     M("TemporalPlainDateTimePrototype", SV("subtract"), "PlainDateTime", "subtract", 1),
     M("TemporalPlainDateTimePrototype", SV("until"), "PlainDateTime", "until", 1),
     M("TemporalPlainDateTimePrototype", SV("since"), "PlainDateTime", "since", 1),
     M("TemporalPlainDateTimePrototype", SV("round"), "PlainDateTime", "round", 1),
     M("TemporalPlainDateTimePrototype", SV("equals"), "PlainDateTime", "equals", 1),
     M("TemporalPlainDateTimePrototype", SV("toString"), "PlainDateTime", "toString", 0),
     M("TemporalPlainDateTimePrototype", SV("toLocaleString"), "PlainDateTime", "toLocaleString", 0),
     M("TemporalPlainDateTimePrototype", SV("toJSON"), "PlainDateTime", "toJSON", 0),
     M("TemporalPlainDateTimePrototype", SV("valueOf"), "PlainDateTime", "valueOf", 0),
     M("TemporalPlainDateTimePrototype", SV("toZonedDateTime"), "PlainDateTime", "toZonedDateTime", 1),
     M("TemporalPlainDateTimePrototype", SV("toPlainDate"), "PlainDateTime", "toPlainDate", 0),
     M("TemporalPlainDateTimePrototype", SV("toPlainTime"), "PlainDateTime", "toPlainTime", 0),
     V("TemporalPlainDateTimePrototype", SymToStringTag, SV("Temporal.PlainDateTime"), FALSE, FALSE, TRUE),
     \* ZonedDateTime.
     M("TemporalZonedDateTime", SV("from"), "ZonedDateTime", "from", 1),
     M("TemporalZonedDateTime", SV("compare"), "ZonedDateTime", "compare", 2),
     G("TemporalZonedDateTimePrototype", SV("calendarId"), "ZonedDateTime", "calendarId", ""),
     G("TemporalZonedDateTimePrototype", SV("timeZoneId"), "ZonedDateTime", "timeZoneId", ""),
     G("TemporalZonedDateTimePrototype", SV("era"), "ZonedDateTime", "era", ""),
     G("TemporalZonedDateTimePrototype", SV("eraYear"), "ZonedDateTime", "eraYear", ""),
     G("TemporalZonedDateTimePrototype", SV("year"), "ZonedDateTime", "year", ""),
     G("TemporalZonedDateTimePrototype", SV("yearOfWeek"), "ZonedDateTime", "yearOfWeek", ""),
     G("TemporalZonedDateTimePrototype", SV("inLeapYear"), "ZonedDateTime", "inLeapYear", ""),
     G("TemporalZonedDateTimePrototype", SV("month"), "ZonedDateTime", "month", ""),
     G("TemporalZonedDateTimePrototype", SV("monthCode"), "ZonedDateTime", "monthCode", ""),
     G("TemporalZonedDateTimePrototype", SV("monthsInYear"), "ZonedDateTime", "monthsInYear", ""),
     G("TemporalZonedDateTimePrototype", SV("day"), "ZonedDateTime", "day", ""),
     G("TemporalZonedDateTimePrototype", SV("weekOfYear"), "ZonedDateTime", "weekOfYear", ""),
     G("TemporalZonedDateTimePrototype", SV("dayOfWeek"), "ZonedDateTime", "dayOfWeek", ""),
     G("TemporalZonedDateTimePrototype", SV("dayOfYear"), "ZonedDateTime", "dayOfYear", ""),
     G("TemporalZonedDateTimePrototype", SV("daysInWeek"), "ZonedDateTime", "daysInWeek", ""),
     G("TemporalZonedDateTimePrototype", SV("daysInMonth"), "ZonedDateTime", "daysInMonth", ""),
     G("TemporalZonedDateTimePrototype", SV("daysInYear"), "ZonedDateTime", "daysInYear", ""),
     G("TemporalZonedDateTimePrototype", SV("hour"), "ZonedDateTime", "hour", ""),
     G("TemporalZonedDateTimePrototype", SV("hoursInDay"), "ZonedDateTime", "hoursInDay", ""),
     G("TemporalZonedDateTimePrototype", SV("minute"), "ZonedDateTime", "minute", ""),
     G("TemporalZonedDateTimePrototype", SV("second"), "ZonedDateTime", "second", ""),
     G("TemporalZonedDateTimePrototype", SV("millisecond"), "ZonedDateTime", "millisecond", ""),
     G("TemporalZonedDateTimePrototype", SV("microsecond"), "ZonedDateTime", "microsecond", ""),
     G("TemporalZonedDateTimePrototype", SV("nanosecond"), "ZonedDateTime", "nanosecond", ""),
     G("TemporalZonedDateTimePrototype", SV("epochMilliseconds"), "ZonedDateTime", "epochMilliseconds", ""),
     G("TemporalZonedDateTimePrototype", SV("epochNanoseconds"), "ZonedDateTime", "epochNanoseconds", ""),
     G("TemporalZonedDateTimePrototype", SV("offsetNanoseconds"), "ZonedDateTime", "offsetNanoseconds", ""),
     G("TemporalZonedDateTimePrototype", SV("offset"), "ZonedDateTime", "offset", ""),
     M("TemporalZonedDateTimePrototype", SV("with"), "ZonedDateTime", "with", 1),
     M("TemporalZonedDateTimePrototype", SV("withTimeZone"), "ZonedDateTime", "withTimeZone", 1),
     M("TemporalZonedDateTimePrototype", SV("withCalendar"), "ZonedDateTime", "withCalendar", 1),
     M("TemporalZonedDateTimePrototype", SV("withPlainTime"), "ZonedDateTime", "withPlainTime", 0),
     M("TemporalZonedDateTimePrototype", SV("add"), "ZonedDateTime", "add", 1),
     M("TemporalZonedDateTimePrototype", SV("subtract"), "ZonedDateTime", "subtract", 1),
     M("TemporalZonedDateTimePrototype", SV("until"), "ZonedDateTime", "until", 1),
     M("TemporalZonedDateTimePrototype", SV("since"), "ZonedDateTime", "since", 1),
     M("TemporalZonedDateTimePrototype", SV("round"), "ZonedDateTime", "round", 1),
     M("TemporalZonedDateTimePrototype", SV("equals"), "ZonedDateTime", "equals", 1),
     M("TemporalZonedDateTimePrototype", SV("toString"), "ZonedDateTime", "toString", 0),
     M("TemporalZonedDateTimePrototype", SV("toLocaleString"), "ZonedDateTime", "toLocaleString", 0),
     M("TemporalZonedDateTimePrototype", SV("toJSON"), "ZonedDateTime", "toJSON", 0),
     M("TemporalZonedDateTimePrototype", SV("valueOf"), "ZonedDateTime", "valueOf", 0),
     M("TemporalZonedDateTimePrototype", SV("startOfDay"), "ZonedDateTime", "startOfDay", 0),
     M("TemporalZonedDateTimePrototype", SV("getTimeZoneTransition"), "ZonedDateTime", "getTimeZoneTransition", 1),
     M("TemporalZonedDateTimePrototype", SV("toInstant"), "ZonedDateTime", "toInstant", 0),
     M("TemporalZonedDateTimePrototype", SV("toPlainDate"), "ZonedDateTime", "toPlainDate", 0),
     M("TemporalZonedDateTimePrototype", SV("toPlainTime"), "ZonedDateTime", "toPlainTime", 0),
     M("TemporalZonedDateTimePrototype", SV("toPlainDateTime"), "ZonedDateTime", "toPlainDateTime", 0),
     V("TemporalZonedDateTimePrototype", SymToStringTag, SV("Temporal.ZonedDateTime"), FALSE, FALSE, TRUE),
     \* Instant.
     M("TemporalInstant", SV("from"), "Instant", "from", 1),
     M("TemporalInstant", SV("fromEpochMilliseconds"), "Instant", "fromEpochMilliseconds", 1),
     M("TemporalInstant", SV("fromEpochNanoseconds"), "Instant", "fromEpochNanoseconds", 1),
     M("TemporalInstant", SV("compare"), "Instant", "compare", 2),
     G("TemporalInstantPrototype", SV("epochMilliseconds"), "Instant", "epochMilliseconds", ""),
     G("TemporalInstantPrototype", SV("epochNanoseconds"), "Instant", "epochNanoseconds", ""),
     M("TemporalInstantPrototype", SV("add"), "Instant", "add", 1),
     M("TemporalInstantPrototype", SV("subtract"), "Instant", "subtract", 1),
     M("TemporalInstantPrototype", SV("until"), "Instant", "until", 1),
     M("TemporalInstantPrototype", SV("since"), "Instant", "since", 1),
     M("TemporalInstantPrototype", SV("round"), "Instant", "round", 1),
     M("TemporalInstantPrototype", SV("equals"), "Instant", "equals", 1),
     M("TemporalInstantPrototype", SV("toString"), "Instant", "toString", 0),
     M("TemporalInstantPrototype", SV("toLocaleString"), "Instant", "toLocaleString", 0),
     M("TemporalInstantPrototype", SV("toJSON"), "Instant", "toJSON", 0),
     M("TemporalInstantPrototype", SV("valueOf"), "Instant", "valueOf", 0),
     M("TemporalInstantPrototype", SV("toZonedDateTimeISO"), "Instant", "toZonedDateTimeISO", 1),
     V("TemporalInstantPrototype", SymToStringTag, SV("Temporal.Instant"), FALSE, FALSE, TRUE),
     \* PlainYearMonth.
     M("TemporalPlainYearMonth", SV("from"), "PlainYearMonth", "from", 1),
     M("TemporalPlainYearMonth", SV("compare"), "PlainYearMonth", "compare", 2),
     G("TemporalPlainYearMonthPrototype", SV("calendarId"), "PlainYearMonth", "calendarId", ""),
     G("TemporalPlainYearMonthPrototype", SV("era"), "PlainYearMonth", "era", ""),
     G("TemporalPlainYearMonthPrototype", SV("eraYear"), "PlainYearMonth", "eraYear", ""),
     G("TemporalPlainYearMonthPrototype", SV("year"), "PlainYearMonth", "year", ""),
     G("TemporalPlainYearMonthPrototype", SV("month"), "PlainYearMonth", "month", ""),
     G("TemporalPlainYearMonthPrototype", SV("monthCode"), "PlainYearMonth", "monthCode", ""),
     G("TemporalPlainYearMonthPrototype", SV("daysInYear"), "PlainYearMonth", "daysInYear", ""),
     G("TemporalPlainYearMonthPrototype", SV("daysInMonth"), "PlainYearMonth", "daysInMonth", ""),
     G("TemporalPlainYearMonthPrototype", SV("monthsInYear"), "PlainYearMonth", "monthsInYear", ""),
     G("TemporalPlainYearMonthPrototype", SV("inLeapYear"), "PlainYearMonth", "inLeapYear", ""),
     M("TemporalPlainYearMonthPrototype", SV("with"), "PlainYearMonth", "with", 1),
     M("TemporalPlainYearMonthPrototype", SV("add"), "PlainYearMonth", "add", 1),
     M("TemporalPlainYearMonthPrototype", SV("subtract"), "PlainYearMonth", "subtract", 1),
     M("TemporalPlainYearMonthPrototype", SV("until"), "PlainYearMonth", "until", 1),
     M("TemporalPlainYearMonthPrototype", SV("since"), "PlainYearMonth", "since", 1),
     M("TemporalPlainYearMonthPrototype", SV("equals"), "PlainYearMonth", "equals", 1),
     M("TemporalPlainYearMonthPrototype", SV("toString"), "PlainYearMonth", "toString", 0),
     M("TemporalPlainYearMonthPrototype", SV("toLocaleString"), "PlainYearMonth", "toLocaleString", 0),
     M("TemporalPlainYearMonthPrototype", SV("toJSON"), "PlainYearMonth", "toJSON", 0),
     M("TemporalPlainYearMonthPrototype", SV("valueOf"), "PlainYearMonth", "valueOf", 0),
     M("TemporalPlainYearMonthPrototype", SV("toPlainDate"), "PlainYearMonth", "toPlainDate", 1),
     V("TemporalPlainYearMonthPrototype", SymToStringTag, SV("Temporal.PlainYearMonth"), FALSE, FALSE, TRUE),
     \* PlainMonthDay.
     M("TemporalPlainMonthDay", SV("from"), "PlainMonthDay", "from", 1),
     G("TemporalPlainMonthDayPrototype", SV("calendarId"), "PlainMonthDay", "calendarId", ""),
     G("TemporalPlainMonthDayPrototype", SV("monthCode"), "PlainMonthDay", "monthCode", ""),
     G("TemporalPlainMonthDayPrototype", SV("day"), "PlainMonthDay", "day", ""),
     M("TemporalPlainMonthDayPrototype", SV("with"), "PlainMonthDay", "with", 1),
     M("TemporalPlainMonthDayPrototype", SV("equals"), "PlainMonthDay", "equals", 1),
     M("TemporalPlainMonthDayPrototype", SV("toString"), "PlainMonthDay", "toString", 0),
     M("TemporalPlainMonthDayPrototype", SV("toLocaleString"), "PlainMonthDay", "toLocaleString", 0),
     M("TemporalPlainMonthDayPrototype", SV("toJSON"), "PlainMonthDay", "toJSON", 0),
     M("TemporalPlainMonthDayPrototype", SV("valueOf"), "PlainMonthDay", "valueOf", 0),
     M("TemporalPlainMonthDayPrototype", SV("toPlainDate"), "PlainMonthDay", "toPlainDate", 1),
     V("TemporalPlainMonthDayPrototype", SymToStringTag, SV("Temporal.PlainMonthDay"), FALSE, FALSE, TRUE),
     \* Now.
     M("TemporalNow", SV("timeZoneId"), "TemporalNow", "timeZoneId", 0),
     M("TemporalNow", SV("instant"), "TemporalNow", "instant", 0),
     M("TemporalNow", SV("plainDateTimeISO"), "TemporalNow", "plainDateTimeISO", 0),
     M("TemporalNow", SV("zonedDateTimeISO"), "TemporalNow", "zonedDateTimeISO", 0),
     M("TemporalNow", SV("plainDateISO"), "TemporalNow", "plainDateISO", 0),
     M("TemporalNow", SV("plainTimeISO"), "TemporalNow", "plainTimeISO", 0),
     V("TemporalNow", SymToStringTag, SV("Temporal.Now"), FALSE, FALSE, TRUE) >>
