\* Temporal's ISO 8601 and RFC 9557 string grammar (Temporal §13.33), parsed as engine262's
\* DateParser does: by backtracking over code units. A parser takes the units u and the index p of
\* the next unit and gives TPFail or TPOk(the index after the match, the parse node).

TPFail == [ok |-> FALSE]
TPOk(p, v) == [ok |-> TRUE, p |-> p, v |-> v]
\* r matches all of u.
TPFull(u, r) == r.ok /\ r.p = Len(u) + 1

TPAt(u, p) == IF p >= 1 /\ p <= Len(u) THEN u[p] ELSE -1
TPDigit(u, p) == IsDigit(TPAt(u, p))
\* The value of the decimal digits u[a..b].
TPInt(u, a, b) == IF a > b THEN 0 ELSE TPInt(u, a, b - 1) * 10 + u[b] - 48
\* The index after the run of at most max digits starting at p.
TPDigitsEnd(u, p, max) == IF max > 0 /\ TPDigit(u, p) THEN TPDigitsEnd(u, p + 1, max - 1) ELSE p
TPLower(u) == [i \in DOMAIN u |-> IF u[i] >= 65 /\ u[i] <= 90 THEN u[i] + 32 ELSE u[i]]
TPAlpha(c) == (c >= 65 /\ c <= 90) \/ (c >= 97 /\ c <= 122)

\* Two digits from the first set of tens followed by any digit in the matching range, as the
\* regular expressions of DateMonth, DateDay, Hour, Minute, and Second do.
TPTwoDigits(u, p, ranges) ==
  IF \E r \in ranges : TPAt(u, p) = r[1] /\ TPAt(u, p + 1) >= r[2] /\ TPAt(u, p + 1) <= r[3]
  THEN TPOk(p + 2, TPInt(u, p, p + 1)) ELSE TPFail
\* DateMonth, 01 to 12; DateDay, 01 to 31; Hour, 00 to 23; and Minute and Second, 00 to 59.
TPDateMonth(u, p) == TPTwoDigits(u, p, {<<48, 49, 57>>, <<49, 48, 50>>})
TPDateDay(u, p) == TPTwoDigits(u, p, {<<48, 49, 57>>, <<49, 48, 57>>, <<50, 48, 57>>, <<51, 48, 49>>})
TPHour(u, p) == TPTwoDigits(u, p, {<<48, 48, 57>>, <<49, 48, 57>>, <<50, 48, 51>>})
TPMinute(u, p) == TPTwoDigits(u, p, {<<d, 48, 57>> : d \in 48..53})

\* DateYear: four digits, or a sign and six digits other than -000000.
TPDateYear(u, p) ==
  IF TPDigitsEnd(u, p, 4) = p + 4 THEN TPOk(p + 4, TPInt(u, p, p + 3))
  ELSE IF TPAt(u, p) \in {43, 45} /\ TPDigitsEnd(u, p + 1, 6) = p + 7 THEN
    LET n == TPInt(u, p + 1, p + 6) IN
    IF TPAt(u, p) = 45 /\ n = 0 THEN TPFail ELSE TPOk(p + 7, IF TPAt(u, p) = 45 THEN -n ELSE n)
  ELSE TPFail

\* IsValidMonthDay and IsValidDate (ECMA-262 PR 3759).
TPValidMonthDay(month, day) == ~((day = 31 /\ month \in {2, 4, 6, 9, 11}) \/ (month = 2 /\ day = 30))
TPValidDate(d) == TPValidMonthDay(d.month, d.day) /\ ~(d.month = 2 /\ d.day = 29 /\ ~IsLeapYear(d.year))

\* Date: DateYear, DateMonth, and DateDay, separated by "-" in the extended format.
TPDate(u, p) ==
  LET year == TPDateYear(u, p) IN IF ~year.ok THEN TPFail ELSE
  LET extended == TPAt(u, year.p) = 45
      month == TPDateMonth(u, IF extended THEN year.p + 1 ELSE year.p)
  IN IF ~month.ok \/ (extended /\ TPAt(u, month.p) # 45) THEN TPFail ELSE
  LET day == TPDateDay(u, IF extended THEN month.p + 1 ELSE month.p) IN IF ~day.ok THEN TPFail ELSE
  LET d == [year |-> year.v, month |-> month.v, day |-> day.v] IN
  IF TPValidDate(d) THEN TPOk(day.p, d) ELSE TPFail

\* DateSpecYearMonth and DateSpecMonthDay.
TPDateSpecYearMonth(u, p) ==
  LET year == TPDateYear(u, p) IN IF ~year.ok THEN TPFail ELSE
  LET month == TPDateMonth(u, IF TPAt(u, year.p) = 45 THEN year.p + 1 ELSE year.p) IN
  IF ~month.ok THEN TPFail ELSE TPOk(month.p, [year |-> year.v, month |-> month.v, day |-> Empty])
TPDateSpecMonthDay(u, p) ==
  LET month == TPDateMonth(u, IF TPAt(u, p) = 45 /\ TPAt(u, p + 1) = 45 THEN p + 2 ELSE p) IN
  IF ~month.ok THEN TPFail ELSE
  LET day == TPDateDay(u, IF TPAt(u, month.p) = 45 THEN month.p + 1 ELSE month.p) IN
  IF ~day.ok \/ ~TPValidMonthDay(month.v, day.v) THEN TPFail
  ELSE TPOk(day.p, [year |-> Empty, month |-> month.v, day |-> day.v])

\* TemporalDecimalFraction: "." or "," and one to nine digits, with Empty for none.
TPFraction(u, p) ==
  IF TPAt(u, p) \notin {44, 46} THEN TPOk(p, Empty)
  ELSE LET end == TPDigitsEnd(u, p + 1, 9) IN
       IF end = p + 1 THEN TPFail ELSE TPOk(end, SubSeq(u, p + 1, end - 1))

\* Time: Hour, then Minute, then Second (which may be 60) and a fraction, separated by ":" in the
\* extended format. Absent parts are Empty.
TPTime(u, p) ==
  LET hour == TPHour(u, p) IN IF ~hour.ok THEN TPFail ELSE
  LET node == [hour |-> hour.v, minute |-> Empty, second |-> Empty, fraction |-> Empty] IN
  IF TPAt(u, hour.p) \notin {58, 48, 49, 50, 51, 52, 53} THEN TPOk(hour.p, node) ELSE
  LET extended == TPAt(u, hour.p) = 58
      minute == TPMinute(u, IF extended THEN hour.p + 1 ELSE hour.p)
  IN IF ~minute.ok THEN TPFail
     ELSE IF TPAt(u, minute.p) \notin (IF extended THEN {58} ELSE {}) \cup 48..54
     THEN TPOk(minute.p, [node EXCEPT !.minute = minute.v])
     ELSE IF extended /\ TPAt(u, minute.p) # 58 THEN TPFail ELSE
  LET at == IF extended THEN minute.p + 1 ELSE minute.p
      second == IF TPAt(u, at) = 54 /\ TPAt(u, at + 1) = 48 THEN TPOk(at + 2, 60) ELSE TPMinute(u, at)
  IN IF ~second.ok THEN TPFail ELSE
  LET fraction == TPFraction(u, second.p) IN IF ~fraction.ok THEN TPFail ELSE
  TPOk(fraction.p, [hour |-> hour.v, minute |-> minute.v, second |-> second.v, fraction |-> fraction.v])

\* UTCOffset[SubMinutePrecision]: a sign and an Hour, then Minute, then (with sub-minute
\* precision) Second and a fraction. The node keeps its source text.
TPOffsetNode(u, from, to, hour, minute, second, fraction) ==
  [sign |-> IF u[from] = 45 THEN -1 ELSE 1, hour |-> hour, minute |-> minute, second |-> second,
   fraction |-> fraction, text |-> SubSeq(u, from, to - 1)]
TPUTCOffset(u, p, subMinute) ==
  IF TPAt(u, p) \notin {43, 45} THEN TPFail ELSE
  LET hour == TPHour(u, p + 1) IN IF ~hour.ok THEN TPFail
  ELSE IF TPAt(u, hour.p) \notin {58} \cup 48..54 THEN TPOk(hour.p, TPOffsetNode(u, p, hour.p, hour.v, 0, 0, Empty)) ELSE
  LET extended == TPAt(u, hour.p) = 58
      minute == TPMinute(u, IF extended THEN hour.p + 1 ELSE hour.p)
  IN IF ~minute.ok THEN TPFail
     ELSE IF ~subMinute \/ TPAt(u, minute.p) \notin {58} \cup 48..54
     THEN TPOk(minute.p, TPOffsetNode(u, p, minute.p, hour.v, minute.v, 0, Empty))
     ELSE IF extended /\ TPAt(u, minute.p) # 58 THEN TPFail ELSE
  LET second == TPMinute(u, IF extended THEN minute.p + 1 ELSE minute.p) IN IF ~second.ok THEN TPFail ELSE
  LET fraction == TPFraction(u, second.p) IN IF ~fraction.ok THEN TPFail ELSE
  TPOk(fraction.p, TPOffsetNode(u, p, fraction.p, hour.v, minute.v, second.v, fraction.v))

\* DateTimeUTCOffset[Z]: the UTC designator Z (when allowed) or an offset, as [z, offset].
TPDateTimeOffset(u, p, z) ==
  IF z /\ TPAt(u, p) \in {90, 122} THEN TPOk(p + 1, [z |-> TRUE, offset |-> Empty])
  ELSE LET o == TPUTCOffset(u, p, TRUE) IN
       IF o.ok THEN TPOk(o.p, [z |-> FALSE, offset |-> o.v]) ELSE TPFail
TPNoOffset == [z |-> FALSE, offset |-> Empty]

\* DateTime[Z, TimeRequired]: a Date, then a separator, a Time, and an optional offset.
TPDateTime(u, p, z, timeRequired) ==
  LET date == TPDate(u, p) IN IF ~date.ok THEN TPFail
  ELSE IF TPAt(u, date.p) \notin {32, 84, 116} THEN
    IF timeRequired THEN TPFail ELSE TPOk(date.p, [date |-> date.v, time |-> Empty, offset |-> TPNoOffset])
  ELSE LET time == TPTime(u, date.p + 1) IN IF ~time.ok THEN TPFail
  ELSE IF TPAt(u, time.p) \notin {90, 122, 43, 45} THEN TPOk(time.p, [date |-> date.v, time |-> time.v, offset |-> TPNoOffset])
  ELSE LET offset == TPDateTimeOffset(u, time.p, z) IN
       IF offset.ok THEN TPOk(offset.p, [date |-> date.v, time |-> time.v, offset |-> offset.v]) ELSE TPFail

\* TimeZoneIANAName: components of [._a-zA-Z][._a-zA-Z0-9+-]* separated by "/".
TPNameStart(c) == c \in {46, 95} \/ TPAlpha(c)
TPNamePart(c) == TPNameStart(c) \/ IsDigit(c) \/ c \in {43, 45}
TPNameEnd(u, p) == IF TPNamePart(TPAt(u, p)) THEN TPNameEnd(u, p + 1) ELSE p
TPIANAName(u, p) ==
  IF ~TPNameStart(TPAt(u, p)) THEN TPFail
  ELSE LET end == TPNameEnd(u, p + 1) IN
       IF TPAt(u, end) = 47 THEN TPIANAName(u, end + 1) ELSE TPOk(end, Empty)

\* TimeZoneIdentifier: an offset without sub-minute precision, or an IANA name, as [offset, name,
\* text] with Empty for the absent one.
TPTimeZoneIdentifier(u, p) ==
  IF TPAt(u, p) \in {43, 45} THEN
    LET o == TPUTCOffset(u, p, FALSE) IN
    IF o.ok THEN TPOk(o.p, [offset |-> o.v, name |-> Empty, text |-> SubSeq(u, p, o.p - 1)]) ELSE TPFail
  ELSE LET n == TPIANAName(u, p) IN
       IF n.ok THEN TPOk(n.p, [offset |-> Empty, name |-> SubSeq(u, p, n.p - 1), text |-> SubSeq(u, p, n.p - 1)])
       ELSE TPFail

\* TimeZoneAnnotation: "[", an optional critical flag "!", a TimeZoneIdentifier, and "]".
TPTimeZoneAnnotation(u, p) ==
  IF TPAt(u, p) # 91 THEN TPFail ELSE
  LET critical == TPAt(u, p + 1) = 33
      id == TPTimeZoneIdentifier(u, IF critical THEN p + 2 ELSE p + 1)
  IN IF ~id.ok \/ TPAt(u, id.p) # 93 THEN TPFail ELSE TPOk(id.p + 1, [critical |-> critical, id |-> id.v])

\* Annotations: one or more "[" "!"? AnnotationKey "=" AnnotationValue "]", as [critical, key, value].
TPKeyStart(c) == (c >= 97 /\ c <= 122) \/ c = 95
TPKeyEnd(u, p) == IF TPKeyStart(TPAt(u, p)) \/ TPDigit(u, p) \/ TPAt(u, p) = 45 THEN TPKeyEnd(u, p + 1) ELSE p
TPAlnumEnd(u, p) == IF TPAlpha(TPAt(u, p)) \/ TPDigit(u, p) THEN TPAlnumEnd(u, p + 1) ELSE p
TPAnnotationValue(u, p) ==
  LET end == TPAlnumEnd(u, p) IN
  IF end = p THEN TPFail ELSE IF TPAt(u, end) = 45 THEN TPAnnotationValue(u, end + 1) ELSE TPOk(end, Empty)
TPAnnotations(u, p, acc) ==
  IF TPAt(u, p) # 91 THEN IF acc = <<>> THEN TPFail ELSE TPOk(p, acc) ELSE
  LET critical == TPAt(u, p + 1) = 33
      keyAt == IF critical THEN p + 2 ELSE p + 1
      keyEnd == IF TPKeyStart(TPAt(u, keyAt)) THEN TPKeyEnd(u, keyAt + 1) ELSE keyAt
      value == TPAnnotationValue(u, keyEnd + 1)
  IN IF keyEnd = keyAt \/ TPAt(u, keyEnd) # 61 \/ ~value.ok \/ TPAt(u, value.p) # 93 THEN TPFail
     ELSE TPAnnotations(u, value.p + 1, Append(acc, [critical |-> critical, key |-> SubSeq(u, keyAt, keyEnd - 1),
                                                     value |-> SubSeq(u, keyEnd + 1, value.p - 1)]))

\* The optional time zone annotation and annotations after a date or time at p, as a goal node
\* [kind, dateTime, tz, annotations, ambiguous] when they parse.
TPAnnotated(u, p, kind, dateTime, tzRequired) ==
  LET tz == TPTimeZoneAnnotation(u, p) IN
  IF tzRequired /\ ~tz.ok THEN TPFail ELSE
  LET afterTz == IF tz.ok THEN tz.p ELSE p
      annotations == IF TPAt(u, afterTz) = 91 THEN TPAnnotations(u, afterTz, <<>>) ELSE TPOk(afterTz, <<>>)
  IN IF ~annotations.ok THEN TPFail
     ELSE TPOk(annotations.p, [kind |-> kind, dateTime |-> dateTime, tz |-> IF tz.ok THEN tz.v ELSE Empty,
                               annotations |-> annotations.v, ambiguous |-> FALSE])

\* AnnotatedDateTime[Zoned, TimeRequired].
TPAnnotatedDateTime(u, p, zoned, timeRequired) ==
  LET dt == TPDateTime(u, p, zoned, timeRequired) IN
  IF dt.ok THEN TPAnnotated(u, dt.p, "dateTime", dt.v, zoned) ELSE TPFail

\* AnnotatedTime: an optional "T", a Time, and an optional offset without Z. Its early error is
\* the time and offset also parsing as a DateSpecMonthDay or DateSpecYearMonth.
TPAnnotatedTime(u, p) ==
  LET time == TPTime(u, IF TPAt(u, p) \in {84, 116} THEN p + 1 ELSE p) IN IF ~time.ok THEN TPFail ELSE
  LET offset == IF TPAt(u, time.p) \in {43, 45} THEN TPDateTimeOffset(u, time.p, FALSE) ELSE TPOk(time.p, TPNoOffset) IN
  IF ~offset.ok THEN TPFail ELSE
  LET text == SubSeq(u, p, offset.p - 1)
      r == TPAnnotated(u, offset.p, "time", [date |-> Empty, time |-> time.v, offset |-> offset.v], FALSE)
  IN IF ~r.ok THEN TPFail
     ELSE TPOk(r.p, [r.v EXCEPT !.ambiguous = TPFull(text, TPDateSpecMonthDay(text, 1)) \/
                                               TPFull(text, TPDateSpecYearMonth(text, 1))])

\* AnnotatedYearMonth and AnnotatedMonthDay.
TPAnnotatedSpec(u, kind) ==
  LET spec == IF kind = "yearMonth" THEN TPDateSpecYearMonth(u, 1) ELSE TPDateSpecMonthDay(u, 1) IN
  IF spec.ok THEN TPAnnotated(u, spec.p, kind, [date |-> spec.v, time |-> Empty, offset |-> TPNoOffset], FALSE)
  ELSE TPFail

\* TemporalInstantString: a Date, separator, Time, and a required offset or Z.
TPInstantString(u) ==
  LET date == TPDate(u, 1) IN IF ~date.ok \/ TPAt(u, date.p) \notin {32, 84, 116} THEN TPFail ELSE
  LET time == TPTime(u, date.p + 1) IN IF ~time.ok THEN TPFail ELSE
  LET offset == TPDateTimeOffset(u, time.p, TRUE) IN
  IF offset.ok THEN TPAnnotated(u, offset.p, "dateTime", [date |-> date.v, time |-> time.v, offset |-> offset.v], FALSE)
  ELSE TPFail

\* A goal symbol of ParseISODateTime, parsing all of u. A goal whose first alternative parses all
\* of u keeps it, as engine262's try does, even when it has an early error.
TPGoal(u, goal) ==
  CASE goal = "zoned" -> TPAnnotatedDateTime(u, 1, TRUE, FALSE)
    [] goal = "plain" -> TPAnnotatedDateTime(u, 1, FALSE, FALSE)
    [] goal = "instant" -> TPInstantString(u)
    [] goal = "time" ->
         LET t == TPAnnotatedTime(u, 1) IN IF TPFull(u, t) THEN t ELSE TPAnnotatedDateTime(u, 1, FALSE, TRUE)
    [] goal \in {"yearMonth", "monthDay"} ->
         LET t == TPAnnotatedSpec(u, goal) IN IF TPFull(u, t) THEN t ELSE TPAnnotatedDateTime(u, 1, FALSE, FALSE)

\* The goals of each allowed format of ParseISODateTime.
TPGoals(format) ==
  CASE format = "all" -> <<"zoned", "plain", "instant", "time", "monthDay", "yearMonth">>
    [] format = "any-date-time" -> <<"zoned", "plain">>
    [] format = "zoned-date-time" -> <<"zoned">>
    [] format = "plain-date-time" -> <<"plain">>
    [] format = "instant" -> <<"instant">>
    [] format = "time" -> <<"time">>
    [] format = "year-month" -> <<"yearMonth">>
    [] format = "month-day" -> <<"monthDay">>

\* The node of the first goal that parses all of u without an early error, or Empty.
TPFirstGoal(u, goals) ==
  IF goals = <<>> THEN Empty
  ELSE LET r == TPGoal(u, Head(goals)) IN
       IF TPFull(u, r) /\ ~r.v.ambiguous THEN r.v ELSE TPFirstGoal(u, Tail(goals))

\* The calendar of the annotations, as [ok, calendar] with Empty for none, or [ok |-> FALSE] when a
\* critical annotation can't be used (ParseISODateTime step 4).
TPCalendarAnnotation(annotations, i, calendar, critical) ==
  IF i > Len(annotations) THEN [ok |-> TRUE, calendar |-> calendar]
  ELSE LET a == annotations[i] IN
    IF a.key = N("u-ca") THEN
      IF calendar = Empty THEN TPCalendarAnnotation(annotations, i + 1, a.value, a.critical)
      ELSE IF a.critical \/ critical THEN [ok |-> FALSE]
      ELSE TPCalendarAnnotation(annotations, i + 1, calendar, critical)
    ELSE IF a.critical THEN [ok |-> FALSE]
    ELSE TPCalendarAnnotation(annotations, i + 1, calendar, critical)

\* The sub-second parts of a fraction's digits, as [ms, us, ns].
TPSubSecond(fraction) ==
  LET digits == IF fraction = Empty THEN Repeat(48, 9) ELSE SubSeq(fraction \o Repeat(48, 9), 1, 9) IN
  [ms |-> TPInt(digits, 1, 3), us |-> TPInt(digits, 4, 6), ns |-> TPInt(digits, 7, 9)]

\* ParseISODateTime (Temporal §13.33.1): the ISO Date-Time Parse Record [year, month, day, time,
\* z, offset, tzAnnotation, calendar] of units, with Empty for an absent year (a month-day string
\* without one), time (start of day), offset string, time zone annotation, or calendar. A string
\* that doesn't parse throws a RangeError.
ParseISODateTime(s, units, format) ==
  LET node == TPFirstGoal(units, TPGoals(format)) IN
  IF node = Empty THEN ThrowError(s, "RangeError") ELSE
  LET calendar == TPCalendarAnnotation(node.annotations, 1, Empty, FALSE) IN
  IF ~calendar.ok THEN ThrowError(s, "RangeError")
  ELSE IF node.kind \in {"yearMonth", "monthDay"} /\ calendar.calendar # Empty /\
          TPLower(calendar.calendar) # N("iso8601") THEN ThrowError(s, "RangeError")
  ELSE LET date == node.dateTime.date
           time == node.dateTime.time
           sub == TPSubSecond(IF time = Empty THEN Empty ELSE time.fraction)
           offset == node.dateTime.offset
       IN Ok(s, [year |-> IF date = Empty THEN 0 ELSE date.year,
                 month |-> IF date = Empty THEN 1 ELSE date.month,
                 day |-> IF date = Empty \/ date.day = Empty THEN 1 ELSE date.day,
                 time |-> IF time = Empty THEN Empty
                          ELSE [hour |-> time.hour, minute |-> IF time.minute = Empty THEN 0 ELSE time.minute,
                                second |-> CASE time.second = Empty -> 0 [] time.second = 60 -> 59 [] OTHER -> time.second,
                                millisecond |-> sub.ms, microsecond |-> sub.us, nanosecond |-> sub.ns],
                 z |-> offset.z,
                 offset |-> IF offset.offset = Empty THEN Empty ELSE offset.offset.text,
                 tzAnnotation |-> IF node.tz = Empty THEN Empty ELSE node.tz.id.text,
                 calendar |-> calendar.calendar])

\* ParseDateTimeUTCOffset (§21.4.1.33.2): the offset in nanoseconds of an offset string, as a BigInt,
\* or a RangeError.
ParseDateTimeUTCOffset(s, units) ==
  LET o == TPUTCOffset(units, 1, TRUE) IN
  IF ~TPFull(units, o) THEN ThrowError(s, "RangeError")
  ELSE Ok(s, TIMul(TI(o.v.sign), TIAdd(TIMul(TI((o.v.hour * 60 + o.v.minute) * 60 + o.v.second), TINsPerSecond),
                                       TI(LET sub == TPSubSecond(o.v.fraction) IN sub.ms * 1000000 + sub.us * 1000 + sub.ns))))

\* ParseTimeZoneIdentifier (Temporal §13.33.4): [name, offsetMinutes] with Empty for the absent one.
ParseTimeZoneIdentifier(s, units) ==
  LET r == TPTimeZoneIdentifier(units, 1) IN
  IF ~TPFull(units, r) THEN ThrowError(s, "RangeError")
  ELSE IF r.v.name # Empty THEN Ok(s, [name |-> r.v.name, offsetMinutes |-> Empty])
  ELSE Ok(s, [name |-> Empty, offsetMinutes |-> r.v.offset.sign * (r.v.offset.hour * 60 + r.v.offset.minute)])

\* The groups of a TemporalDurationString, each [found, p, digits, fraction] for the digits before
\* one of the designators and the fraction digits (Empty for none) when the group allows one.
TPDurationGroup(u, p, designator, allowFraction) ==
  LET end == TPDigitsEnd(u, p, Len(u))
      fraction == IF allowFraction /\ end > p THEN TPFraction(u, end) ELSE TPOk(end, Empty)
      at == IF fraction.ok THEN fraction.p ELSE end
  IN IF end > p /\ fraction.ok /\ TPAt(u, at) \in designator
     THEN [found |-> TRUE, p |-> at + 1, digits |-> SubSeq(u, p, end - 1), fraction |-> fraction.v]
     ELSE [found |-> FALSE, p |-> p, digits |-> <<>>, fraction |-> Empty]

\* TemporalDurationString, as engine262's regular expression matches it (case-insensitively), as
\* [sign, years, months, weeks, days, hours, minutes, seconds] groups, or TPFail.
TPDurationString(u) ==
  LET signed == TPAt(u, 1) \in {43, 45}
      p == IF signed THEN 2 ELSE 1
  IN IF TPAt(u, p) \notin {80, 112} THEN TPFail ELSE
  LET years == TPDurationGroup(u, p + 1, {89, 121}, FALSE)
      months == TPDurationGroup(u, years.p, {77, 109}, FALSE)
      weeks == TPDurationGroup(u, months.p, {87, 119}, FALSE)
      days == TPDurationGroup(u, weeks.p, {68, 100}, FALSE)
      hasTime == TPAt(u, days.p) \in {84, 116}
      hours == TPDurationGroup(u, days.p + 1, {72, 104}, TRUE)
      minutes == TPDurationGroup(u, hours.p, {77, 109}, TRUE)
      seconds == TPDurationGroup(u, minutes.p, {83, 115}, TRUE)
      end == IF hasTime THEN seconds.p ELSE days.p
      anyTime == hasTime /\ (hours.found \/ minutes.found \/ seconds.found)
  IN IF end # Len(u) + 1 \/ (hasTime /\ ~anyTime) \/
        (hasTime /\ hours.fraction # Empty /\ (minutes.found \/ seconds.found)) \/
        (hasTime /\ minutes.fraction # Empty /\ seconds.found) \/
        ~(years.found \/ months.found \/ weeks.found \/ days.found \/ anyTime) THEN TPFail
     ELSE TPOk(end, [sign |-> IF TPAt(u, 1) = 45 THEN -1 ELSE 1, years |-> years, months |-> months,
                     weeks |-> weeks, days |-> days,
                     hours |-> IF hasTime THEN hours ELSE TPDurationGroup(<<>>, 1, {}, FALSE),
                     minutes |-> IF hasTime THEN minutes ELSE TPDurationGroup(<<>>, 1, {}, FALSE),
                     seconds |-> IF hasTime THEN seconds ELSE TPDurationGroup(<<>>, 1, {}, FALSE)])

\* The mathematical value of a group's digits as SnapToInteger reads them, through a Number, which
\* is infinite for too many digits.
TPGroupNumber(g) == PrimitiveToNumber(Str(g.digits)).value
TPGroupValue(g) == IntegralNumberToBigInt(TPGroupNumber(g))
\* A fraction's digits as nanoseconds of its unit, 0 to 999999999.
TPFractionNs(fraction) == LET sub == TPSubSecond(fraction) IN sub.ms * 1000000 + sub.us * 1000 + sub.ns

\* ParseTemporalDurationString (Temporal §7.5.25): the duration's ten fields as BigInts. The
\* fraction of the smallest unit present spreads exactly over the smaller units.
ParseTemporalDurationString(s, units) ==
  LET r == TPDurationString(units) IN
  IF ~r.ok \/ \E g \in {"years", "months", "weeks", "days", "hours", "minutes", "seconds"} : ~NumIsFinite(TPGroupNumber(r.v[g]))
  THEN ThrowError(s, "RangeError") ELSE
  LET d == r.v
      fractionUnit == CASE d.hours.fraction # Empty -> 3600
                        [] d.minutes.fraction # Empty -> 60
                        [] OTHER -> 1
      fraction == CASE d.hours.fraction # Empty -> d.hours.fraction
                    [] d.minutes.fraction # Empty -> d.minutes.fraction
                    [] OTHER -> d.seconds.fraction
      \* The fraction in nanoseconds.
      rest == TIMul(TI(TPFractionNs(fraction)), TI(fractionUnit))
      minutes == IF d.hours.fraction # Empty THEN TIFloorDiv(rest, TINsPerMinute) ELSE TPGroupValue(d.minutes)
      afterMinutes == IF d.hours.fraction # Empty THEN TIMod(rest, TINsPerMinute) ELSE rest
      seconds == IF d.hours.fraction # Empty \/ d.minutes.fraction # Empty THEN TIFloorDiv(afterMinutes, TINsPerSecond)
                 ELSE TPGroupValue(d.seconds)
      subSecond == TIToInt(TIMod(afterMinutes, TINsPerSecond))
      sign == TI(d.sign)
  IN Ok(s, << TIMul(sign, TPGroupValue(d.years)), TIMul(sign, TPGroupValue(d.months)),
              TIMul(sign, TPGroupValue(d.weeks)), TIMul(sign, TPGroupValue(d.days)),
              TIMul(sign, TPGroupValue(d.hours)), TIMul(sign, minutes), TIMul(sign, seconds),
              TI(d.sign * (subSecond \div 1000000)), TI(d.sign * ((subSecond \div 1000) % 1000)),
              TI(d.sign * (subSecond % 1000)) >>)
