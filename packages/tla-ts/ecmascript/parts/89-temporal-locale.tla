\* Temporal's toLocaleString, with ECMA-402's CreateDateTimeFormat and FormatDateTime. engine262 has
\* no Intl, so where HostDateFormat says the host has none, toLocaleString gives what toString
\* gives. Otherwise it reads its options in CreateDateTimeFormat's order, and formats through the
\* pattern that the host's table holds for the object's kind, its calendar, and the options: an
\* English pattern of fields, each with its style, where a literal's style is its units. A field's
\* text is as Node writes it in English, from 1583, before which Node writes the Julian calendar, to
\* 9999. Where HostIntl answers for the object, its requested locales, and the options it read, it
\* gives that answer instead. Otherwise it stops at a locale other than English, at a calendar or
\* numbering system option, and at options whose pattern the table leaves out.

\* The options that CreateDateTimeFormat reads after the time zone, in its order (ECMA-402 Table 16,
\* then formatMatcher, dateStyle, and timeStyle), with the values each may take.
DateTimeFormatStyles == {N("full"), N("long"), N("medium"), N("short")}
DateTimeFormatOptions ==
  <<[key |-> "weekday", property |-> SV("weekday"), values |-> {N("narrow"), N("short"), N("long")}],
    [key |-> "era", property |-> SV("era"), values |-> {N("narrow"), N("short"), N("long")}],
    [key |-> "year", property |-> SV("year"), values |-> {N("2-digit"), N("numeric")}],
    [key |-> "month", property |-> SV("month"), values |-> {N("2-digit"), N("numeric"), N("narrow"), N("short"), N("long")}],
    [key |-> "day", property |-> SV("day"), values |-> {N("2-digit"), N("numeric")}],
    [key |-> "dayPeriod", property |-> SV("dayPeriod"), values |-> {N("narrow"), N("short"), N("long")}],
    [key |-> "hour", property |-> SV("hour"), values |-> {N("2-digit"), N("numeric")}],
    [key |-> "minute", property |-> SV("minute"), values |-> {N("2-digit"), N("numeric")}],
    [key |-> "second", property |-> SV("second"), values |-> {N("2-digit"), N("numeric")}],
    [key |-> "fractionalSecondDigits", property |-> SV("fractionalSecondDigits"), values |-> {}],
    [key |-> "timeZoneName", property |-> SV("timeZoneName"),
     values |-> {N("short"), N("long"), N("shortOffset"), N("longOffset"), N("shortGeneric"), N("longGeneric")}],
    [key |-> "formatMatcher", property |-> SV("formatMatcher"), values |-> {N("basic"), N("best fit")}],
    [key |-> "dateStyle", property |-> SV("dateStyle"), values |-> DateTimeFormatStyles],
    [key |-> "timeStyle", property |-> SV("timeStyle"), values |-> DateTimeFormatStyles]>>

\* GetNumberOption of fractionalSecondDigits, from 1 to 3.
GetFractionalSecondDigitsOption(s, options) ==
  LET value == Get(s, options, SV("fractionalSecondDigits")) IN IF IsAbrupt(value) THEN value
  ELSE IF Val(value) = Undefined THEN Ok(value.s, Empty) ELSE
  LET n == ToNumber(value.s, Val(value)) IN IF IsAbrupt(n) THEN n ELSE
  LET x == Val(n).value IN
  IF ~NumIsFinite(x) \/ NumLessThan(x, NumFromInt(1)) \/ NumLessThan(NumFromInt(3), x) THEN ThrowError(n.s, "RangeError")
  ELSE Ok(n.s, NumToInt(MathFloor(x)))

\* The options of DateTimeFormatOptions from the ith on, read into acc, a record of each one's
\* value, or Empty.
ReadDateTimeFormatOptions(s, options, i, acc) ==
  IF i > Len(DateTimeFormatOptions) THEN Ok(s, acc) ELSE
  LET option == DateTimeFormatOptions[i]
      value == IF option.key = "fractionalSecondDigits" THEN GetFractionalSecondDigitsOption(s, options)
               ELSE GetStringOption(s, options, option.property, option.values, Empty)
  IN IF IsAbrupt(value) THEN value
     ELSE ReadDateTimeFormatOptions(value.s, options, i + 1, [acc EXCEPT ![option.key] = Val(value)])

\* The key of the host's table for a kind of object, its calendar, and the options it formats with,
\* as a TLA+ string: the kind, the calendar, and each option given, in a fixed order.
DateFormatKeyNames ==
  <<"hourCycle", "weekday", "era", "year", "month", "day", "hour", "minute", "second">>
DateOptionTexts ==
  <<[text |-> "2-digit", units |-> N("2-digit")], [text |-> "numeric", units |-> N("numeric")], [text |-> "narrow", units |-> N("narrow")],
    [text |-> "short", units |-> N("short")], [text |-> "long", units |-> N("long")], [text |-> "full", units |-> N("full")],
    [text |-> "medium", units |-> N("medium")], [text |-> "h11", units |-> N("h11")], [text |-> "h12", units |-> N("h12")],
    [text |-> "h23", units |-> N("h23")], [text |-> "h24", units |-> N("h24")]>>
DateOptionText(u) == DateOptionTexts[CHOOSE i \in DOMAIN DateOptionTexts : DateOptionTexts[i].units = u].text
DateFormatEntry(values, name) == IF values[name] = Empty THEN "" ELSE "|" \o name \o "=" \o DateOptionText(values[name])
DateFormatEntries(values, i) ==
  IF i > Len(DateFormatKeyNames) THEN "" ELSE DateFormatEntry(values, DateFormatKeyNames[i]) \o DateFormatEntries(values, i + 1)
DateFormatKey(kind, calendar, hour12, values) ==
  kind \o "|" \o calendar \o (IF hour12 = Empty THEN "" ELSE "|hour12=" \o IF hour12 THEN "true" ELSE "false") \o
     DateFormatEntries(values, 1) \o
     (CASE values.fractionalSecondDigits = Empty -> ""
        [] values.fractionalSecondDigits = 1 -> "|fractionalSecondDigits=1"
        [] values.fractionalSecondDigits = 2 -> "|fractionalSecondDigits=2"
        [] OTHER -> "|fractionalSecondDigits=3") \o
     DateFormatEntry(values, "dateStyle") \o DateFormatEntry(values, "timeStyle")

\* The text of a field of a pattern for a date [year, month, day] and a time [hour, minute, second,
\* millisecond], where an hour's style is its cycle and width, as "h12 numeric", and a fraction's
\* its digits.
LongMonthNames ==
  <<N("January"), N("February"), N("March"), N("April"), N("May"), N("June"), N("July"), N("August"),
    N("September"), N("October"), N("November"), N("December")>>
LongWeekdayNames == <<N("Monday"), N("Tuesday"), N("Wednesday"), N("Thursday"), N("Friday"), N("Saturday"), N("Sunday")>>
NamedField(name, style) == CASE style = "long" -> name [] style = "short" -> SubSeq(name, 1, 3) [] OTHER -> SubSeq(name, 1, 1)
NumeralField(value, style) == IF style = "2-digit" THEN TwoDigits(value % 100) ELSE IntUnits(value)
LocaleField(field, style, date, time) ==
  LET cycle == SubSeq(style, 1, 3)
      hour == CASE cycle = "h23" -> time[1]
                [] cycle = "h24" -> IF time[1] = 0 THEN 24 ELSE time[1]
                [] cycle = "h11" -> time[1] % 12
                [] OTHER -> IF time[1] % 12 = 0 THEN 12 ELSE time[1] % 12
  IN CASE field = "literal" -> style
       [] field = "year" -> NumeralField(date.year, style)
       [] field = "month" /\ style \in {"numeric", "2-digit"} -> NumeralField(date.month, style)
       [] field = "month" -> NamedField(LongMonthNames[date.month], style)
       [] field = "day" -> NumeralField(date.day, style)
       [] field = "weekday" -> NamedField(LongWeekdayNames[ISODayOfWeek(date)], style)
       [] field = "era" -> CASE style = "long" -> N("Anno Domini") [] style = "short" -> N("AD") [] OTHER -> N("A")
       [] field = "dayPeriod" /\ style \in {"flexible long", "flexible narrow"} ->
            CASE time[1] < 12 -> N("in the morning")
              [] time[1] = 12 -> IF style = "flexible narrow" THEN N("n") ELSE N("noon")
              [] time[1] < 18 -> N("in the afternoon")
              [] time[1] < 21 -> N("in the evening")
              [] OTHER -> N("at night")
       [] field = "dayPeriod" -> IF time[1] < 12 THEN N("AM") ELSE N("PM")
       [] field = "minute" -> NumeralField(time[2], style)
       [] field = "second" -> NumeralField(time[3], style)
       [] field = "fraction" -> SubSeq(PadStart(IntUnits(time[4]), 3), 1, CASE style = "1" -> 1 [] style = "2" -> 2 [] OTHER -> 3)
       [] OTHER -> IF SubSeq(style, 5, Len(style)) = "2-digit" THEN TwoDigits(hour) ELSE IntUnits(hour)
LocaleText(format, i, date, time) ==
  IF i > Len(format.fields) THEN <<>>
  ELSE LocaleField(format.fields[i], format.styles[i], date, time) \o LocaleText(format, i + 1, date, time)

\* The key of HostIntl's entries for a Temporal object of a kind with its slots: its ISO fields, its
\* epoch nanoseconds' units, and its time zone's identifier and its calendar, as it has them.
TemporalFormatKey(kind, slots) ==
  CASE kind \in {"PlainDate", "PlainYearMonth", "PlainMonthDay"} ->
         <<kind, slots.date.year, slots.date.month, slots.date.day, slots.calendar>>
    [] kind = "PlainDateTime" ->
         <<kind, slots.dateTime.date.year, slots.dateTime.date.month, slots.dateTime.date.day>> \o
         TimeFields(slots.dateTime.time) \o <<slots.calendar>>
    [] kind = "PlainTime" -> <<kind>> \o TimeFields(slots.time)
    [] kind = "ZonedDateTime" -> <<kind, TIUnits(slots.epochNs), slots.timeZone.id, slots.calendar>>
    [] OTHER -> <<kind, TIUnits(slots.epochNs)>>
\* The kind of a Temporal object by its class.
TemporalKinds ==
  ("temporalDate" :> "PlainDate") @@ ("temporalDateTime" :> "PlainDateTime") @@ ("temporalYearMonth" :> "PlainYearMonth") @@
  ("temporalMonthDay" :> "PlainMonthDay") @@ ("temporalTime" :> "PlainTime") @@ ("temporalZonedDateTime" :> "ZonedDateTime") @@
  ("temporalInstant" :> "Instant")

\* toLocaleString of a Temporal object of a kind ("PlainDate" and the like) with its slots, where
\* text is what toString gives: what HostIntl answers for its requested locales and the options it
\* read, or else the host's recorded English pattern, for an English locale.
TemporalToLocaleString(s, kind, slots, locales, options, text) ==
  IF HostDateFormat(Empty).found = "none" THEN Ok(s, Str(text))
  \* Temporal.Duration.prototype.toLocaleString: the format of a new Intl.DurationFormat.
  ELSE IF kind = "Duration" THEN
    LET df == DurationFormatConstruct(s, Intrinsic(s, "IntlDurationFormat"), locales, options) IN IF IsAbrupt(df) THEN df ELSE
    LET answer == IntlAnswer(df.s, "DurationFormat", O(df.s, Val(df)).slots.options, "formatToParts",
                             <<<<"duration", [i \in 1..10 |-> TIUnits(slots.fields[i])]>>>>)
    IN IF IsAbrupt(answer) THEN answer ELSE IntlResult(answer.s, "format", Val(answer))
  ELSE LET requested == CanonicalizeLocaleList(s, locales) IN IF IsAbrupt(requested) THEN requested ELSE
  LET o == IF options = Undefined THEN OrdinaryObjectCreate(requested.s, Null) ELSE ToObject(requested.s, options) IN IF IsAbrupt(o) THEN o ELSE
  LET matcher == GetStringOption(o.s, Val(o), SV("localeMatcher"), {N("lookup"), N("best fit")}, Undefined) IN
  IF IsAbrupt(matcher) THEN matcher ELSE
  LET calendar == GetAnyStringOption(matcher.s, Val(o), SV("calendar")) IN IF IsAbrupt(calendar) THEN calendar
  ELSE IF Val(calendar) # Empty /\ ~IsTypeSequenceFrom(Val(calendar), 1, 0) THEN ThrowError(calendar.s, "RangeError")
  ELSE LET numbering == GetAnyStringOption(calendar.s, Val(o), SV("numberingSystem")) IN IF IsAbrupt(numbering) THEN numbering
  ELSE IF Val(numbering) # Empty /\ ~IsTypeSequenceFrom(Val(numbering), 1, 0) THEN ThrowError(numbering.s, "RangeError") ELSE
  LET hour12 == Get(numbering.s, Val(o), SV("hour12")) IN IF IsAbrupt(hour12) THEN hour12 ELSE
  LET hourCycle == GetStringOption(hour12.s, Val(o), SV("hourCycle"), {N("h11"), N("h12"), N("h23"), N("h24")}, Empty) IN
  IF IsAbrupt(hourCycle) THEN hourCycle ELSE
  LET zoneValue == Get(hourCycle.s, Val(o), SV("timeZone")) IN IF IsAbrupt(zoneValue) THEN zoneValue
  ELSE IF Val(zoneValue) # Undefined /\ kind = "ZonedDateTime" THEN ThrowTypeError(zoneValue.s) ELSE
  LET zoneText == IF Val(zoneValue) = Undefined THEN Ok(zoneValue.s, Undefined) ELSE ToStr(zoneValue.s, Val(zoneValue)) IN
  IF IsAbrupt(zoneText) THEN zoneText ELSE
  LET tz == IF Val(zoneText) = Undefined THEN Ok(zoneText.s, UTCTimeZone) ELSE ZonedConstructorTimeZone(zoneText.s, Val(zoneText)) IN
  IF IsAbrupt(tz) THEN tz ELSE
  LET read == ReadDateTimeFormatOptions(tz.s, Val(o), 1, [n \in {DateTimeFormatOptions[i].key : i \in 1..Len(DateTimeFormatOptions)} |-> Empty]) IN
  IF IsAbrupt(read) THEN read ELSE
  LET hostKey == <<"Temporal",
                   <<Val(requested),
                     <<IF Val(matcher) = Undefined THEN Empty ELSE Val(matcher), Val(calendar), Val(numbering),
                       IF Val(hour12) = Undefined THEN Empty ELSE ToBooleanValue(Val(hour12)), Val(hourCycle),
                       IF Val(zoneText) = Undefined THEN Empty ELSE Val(zoneText).value>> \o
                     [i \in 1..Len(DateTimeFormatOptions) |-> Val(read)[DateTimeFormatOptions[i].key]]>>,
                   "toLocaleString", <<TemporalFormatKey(kind, slots)>>>>
      answer == HostIntl(hostKey)
  IN IF answer.found = "value" THEN Ok(read.s, answer.value)
  ELSE IF answer.found = "error" THEN ThrowError(read.s, answer.error)
  ELSE IF Val(calendar) # Empty \/ Val(numbering) # Empty THEN Unsupported(read.s, N("Unsupported: a calendar or numberingSystem option"))
  ELSE IF ~(locales = Undefined \/ (IsString(locales) /\ TPLower(locales.value) \in {N("en"), N("en-us")}))
  THEN Unsupported(read.s, N("Unsupported: a locale other than English")) ELSE
  LET values == Val(read) @@ [hourCycle |-> Val(hourCycle)]
      key == DateFormatKey(kind, IF kind \in {"PlainTime", "Instant"} \/ slots.calendar = ISO8601 THEN "iso8601" ELSE "gregory",
                           IF Val(hour12) = Undefined THEN Empty ELSE ToBooleanValue(Val(hour12)), values)
      format == HostDateFormat(key)
      local == CASE kind = "Instant" -> GetISODateTimeFor(Val(tz), slots.epochNs)
                 [] kind = "PlainTime" -> [date |-> [year |-> 1970, month |-> 1, day |-> 1], time |-> slots.time]
                 [] kind = "PlainDateTime" -> slots.dateTime
                 [] OTHER -> [date |-> slots.date, time |-> MidnightTimeRecord]
  IN CASE kind \notin {"PlainTime", "Instant"} /\ slots.calendar \notin {ISO8601, N("gregory")} ->
            Unsupported(read.s, N("Unsupported: a calendar the host's table leaves out"))
       [] values.dayPeriod # Empty \/ values.timeZoneName # Empty ->
            Unsupported(read.s, N("Unsupported: a dayPeriod or timeZoneName option"))
       [] values.formatMatcher = N("basic") -> Unsupported(read.s, N("Unsupported: the basic format matcher"))
       [] format.found = "error" -> ThrowError(read.s, format.error)
       [] format.found # "format" -> Unsupported(read.s, N("Unsupported: options the host's table leaves out"))
       [] Val(zoneText) # Undefined /\ ~format.isZoned -> Unsupported(read.s, N("Unsupported: a time zone option"))
       [] kind # "PlainTime" /\ (local.date.year < 1583 \/ local.date.year > 9999) ->
            Unsupported(read.s, N("Unsupported: a date that Node writes in the Julian calendar"))
       [] OTHER ->
            Ok(read.s, Str(LocaleText(format, 1, local.date,
                                      <<local.time.hour, local.time.minute, local.time.second, local.time.millisecond>>)))
