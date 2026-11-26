\* ECMA-402's Intl, which engine262 lacks, without its locale data: the namespace, its constructors
\* and their prototypes, as the spec lays them out, and what each of their functions does before it
\* reads locale data, or with what HostLocale gives of it. The constructors of IntlConstructorOptions,
\* NumberFormat, PluralRules, and Locale read their options and make an object that holds them; the
\* others stop. A method of an Intl object reads what it formats, compares, or selects, and gives
\* what HostIntl answers for the object's key and those arguments, and stops where HostIntl has no
\* answer; on another value it throws the TypeError of RequireInternalSlot.

\* The constructors that a call without new constructs too (ECMA-402's normative optional
\* constructor mode), and the methods that UnwrapNumberFormat and UnwrapDateTimeFormat read their
\* receiver through, by the constructor's intrinsic.
IntlCallableConstructors == {"Collator", "DateTimeFormat", "NumberFormat"}
IntlUnwrappingMethods ==
  [m \in {"NumberFormat.format", "NumberFormat.resolvedOptions", "DateTimeFormat.format", "DateTimeFormat.resolvedOptions"} |->
     IF m \in {"NumberFormat.format", "NumberFormat.resolvedOptions"} THEN "IntlNumberFormat" ELSE "IntlDateTimeFormat"]
IntlConstructors ==
  {"DateTimeFormat", "NumberFormat", "Collator", "PluralRules", "RelativeTimeFormat", "ListFormat", "Locale",
   "DisplayNames", "Segmenter", "DurationFormat"}
IntlSupportedLocalesOf == {c \o ".supportedLocalesOf" : c \in IntlConstructors}
IntlServiceOf(m) == CHOOSE c \in IntlConstructors : c \o ".supportedLocalesOf" = m

\* The service of each method of an Intl prototype.
IntlMethodServices ==
  ("Collator.compare" :> "Collator")
  @@ ("Collator.resolvedOptions" :> "Collator")
  @@ ("DateTimeFormat.format" :> "DateTimeFormat")
  @@ ("DateTimeFormat.formatRange" :> "DateTimeFormat")
  @@ ("DateTimeFormat.formatRangeToParts" :> "DateTimeFormat")
  @@ ("DateTimeFormat.formatToParts" :> "DateTimeFormat")
  @@ ("DateTimeFormat.resolvedOptions" :> "DateTimeFormat")
  @@ ("DisplayNames.of" :> "DisplayNames")
  @@ ("DisplayNames.resolvedOptions" :> "DisplayNames")
  @@ ("DurationFormat.format" :> "DurationFormat")
  @@ ("DurationFormat.formatToParts" :> "DurationFormat")
  @@ ("DurationFormat.resolvedOptions" :> "DurationFormat")
  @@ ("ListFormat.format" :> "ListFormat")
  @@ ("ListFormat.formatToParts" :> "ListFormat")
  @@ ("ListFormat.resolvedOptions" :> "ListFormat")
  @@ ("Locale.baseName" :> "Locale")
  @@ ("Locale.calendar" :> "Locale")
  @@ ("Locale.caseFirst" :> "Locale")
  @@ ("Locale.collation" :> "Locale")
  @@ ("Locale.firstDayOfWeek" :> "Locale")
  @@ ("Locale.getCalendars" :> "Locale")
  @@ ("Locale.getCollations" :> "Locale")
  @@ ("Locale.getHourCycles" :> "Locale")
  @@ ("Locale.getNumberingSystems" :> "Locale")
  @@ ("Locale.getTextInfo" :> "Locale")
  @@ ("Locale.getTimeZones" :> "Locale")
  @@ ("Locale.getWeekInfo" :> "Locale")
  @@ ("Locale.hourCycle" :> "Locale")
  @@ ("Locale.language" :> "Locale")
  @@ ("Locale.maximize" :> "Locale")
  @@ ("Locale.minimize" :> "Locale")
  @@ ("Locale.numberingSystem" :> "Locale")
  @@ ("Locale.numeric" :> "Locale")
  @@ ("Locale.region" :> "Locale")
  @@ ("Locale.script" :> "Locale")
  @@ ("Locale.toString" :> "Locale")
  @@ ("NumberFormat.format" :> "NumberFormat")
  @@ ("NumberFormat.formatRange" :> "NumberFormat")
  @@ ("NumberFormat.formatRangeToParts" :> "NumberFormat")
  @@ ("NumberFormat.formatToParts" :> "NumberFormat")
  @@ ("NumberFormat.resolvedOptions" :> "NumberFormat")
  @@ ("PluralRules.resolvedOptions" :> "PluralRules")
  @@ ("PluralRules.select" :> "PluralRules")
  @@ ("PluralRules.selectRange" :> "PluralRules")
  @@ ("RelativeTimeFormat.format" :> "RelativeTimeFormat")
  @@ ("RelativeTimeFormat.formatToParts" :> "RelativeTimeFormat")
  @@ ("RelativeTimeFormat.resolvedOptions" :> "RelativeTimeFormat")
  @@ ("Segmenter.resolvedOptions" :> "Segmenter")
  @@ ("Segmenter.segment" :> "Segmenter")

\* The options that the constructors of the services below read, in their order, each with its key,
\* its kind: "string" with the values it may take, "boolean", "type", a string that must be a type
\* sequence of UTS 35, "timeZone", a time zone's identifier, or "digits", a number from 1 to 3, and
\* whether the constructor throws a TypeError where it's undefined.
IntlOption(key, kind, values, required) == [key |-> key, kind |-> kind, values |-> values, required |-> required]
IntlMatcherOption == IntlOption(SV("localeMatcher"), "string", {N("lookup"), N("best fit")}, FALSE)
IntlStyleOption == IntlOption(SV("style"), "string", {N("long"), N("short"), N("narrow")}, FALSE)
IntlConstructorOptions ==
  [Collator |->
     <<IntlOption(SV("usage"), "string", {N("sort"), N("search")}, FALSE), IntlMatcherOption,
       IntlOption(SV("collation"), "type", {}, FALSE), IntlOption(SV("numeric"), "boolean", {}, FALSE),
       IntlOption(SV("caseFirst"), "string", {N("upper"), N("lower"), N("false")}, FALSE),
       IntlOption(SV("sensitivity"), "string", {N("base"), N("accent"), N("case"), N("variant")}, FALSE),
       IntlOption(SV("ignorePunctuation"), "boolean", {}, FALSE)>>,
   ListFormat |->
     <<IntlMatcherOption, IntlOption(SV("type"), "string", {N("conjunction"), N("disjunction"), N("unit")}, FALSE),
       IntlStyleOption>>,
   Segmenter |-> <<IntlMatcherOption, IntlOption(SV("granularity"), "string", {N("grapheme"), N("word"), N("sentence")}, FALSE)>>,
   DateTimeFormat |->
     <<IntlMatcherOption, IntlOption(SV("calendar"), "type", {}, FALSE), IntlOption(SV("numberingSystem"), "type", {}, FALSE),
       IntlOption(SV("hour12"), "boolean", {}, FALSE),
       IntlOption(SV("hourCycle"), "string", {N("h11"), N("h12"), N("h23"), N("h24")}, FALSE),
       IntlOption(SV("timeZone"), "timeZone", {}, FALSE)>> \o
     [i \in 1..Len(DateTimeFormatOptions) |->
        IntlOption(DateTimeFormatOptions[i].property,
                   IF DateTimeFormatOptions[i].key = "fractionalSecondDigits" THEN "digits" ELSE "string",
                   DateTimeFormatOptions[i].values, FALSE)],
   RelativeTimeFormat |->
     <<IntlMatcherOption, IntlOption(SV("numberingSystem"), "type", {}, FALSE), IntlStyleOption,
       IntlOption(SV("numeric"), "string", {N("always"), N("auto")}, FALSE)>>,
   DisplayNames |->
     <<IntlMatcherOption, IntlOption(SV("style"), "string", {N("narrow"), N("short"), N("long")}, FALSE),
       IntlOption(SV("type"), "string", {N("language"), N("region"), N("script"), N("currency"), N("calendar"), N("dateTimeField")}, TRUE),
       IntlOption(SV("fallback"), "string", {N("code"), N("none")}, FALSE),
       IntlOption(SV("languageDisplay"), "string", {N("dialect"), N("standard")}, FALSE)>>]

\* Whether units are a type sequence: alphanumeric runs of 3 to 8, joined by hyphens.
IsAlphaNumeric(c) == (c >= 48 /\ c <= 57) \/ (c >= 65 /\ c <= 90) \/ (c >= 97 /\ c <= 122)
IsTypeSequenceFrom(u, i, run) ==
  CASE i > Len(u) -> run >= 3 /\ run <= 8
    [] u[i] = 45 -> run >= 3 /\ run <= 8 /\ IsTypeSequenceFrom(u, i + 1, 0)
    [] OTHER -> IsAlphaNumeric(u[i]) /\ IsTypeSequenceFrom(u, i + 1, run + 1)

\* GetOption of each option of a list from the ith on, into acc, the value of each by its key, or
\* Empty where it's undefined.
ReadIntlOptions(s, options, list, i, acc) ==
  IF i > Len(list) THEN Ok(s, acc) ELSE
  LET option == list[i]
      value == Get(s, options, option.key)
  IN IF IsAbrupt(value) THEN value
     ELSE IF Val(value) = Undefined THEN
       IF option.required THEN ThrowTypeError(value.s) ELSE ReadIntlOptions(value.s, options, list, i + 1, acc @@ (option.key :> Empty))
     ELSE IF option.kind = "boolean" THEN ReadIntlOptions(value.s, options, list, i + 1, acc @@ (option.key :> ToBooleanValue(Val(value))))
     ELSE IF option.kind = "digits" THEN
       LET n == ToNumber(value.s, Val(value)) IN IF IsAbrupt(n) THEN n
       ELSE IF ~NumIsFinite(Val(n).value) \/ NumLessThan(Val(n).value, NumFromInt(1)) \/ NumLessThan(NumFromInt(3), Val(n).value)
       THEN ThrowError(n.s, "RangeError")
       ELSE ReadIntlOptions(n.s, options, list, i + 1, acc @@ (option.key :> NumToInt(MathFloor(Val(n).value))))
     ELSE LET str == ToStr(value.s, Val(value)) IN IF IsAbrupt(str) THEN str
     ELSE IF option.kind = "timeZone" THEN
       LET tz == ZonedConstructorTimeZone(str.s, Val(str)) IN IF IsAbrupt(tz) THEN tz
       ELSE ReadIntlOptions(tz.s, options, list, i + 1, acc @@ (option.key :> Val(tz)))
     ELSE IF IF option.kind = "type" THEN ~IsTypeSequenceFrom(Val(str).value, 1, 0) ELSE Val(str).value \notin option.values
     THEN ThrowError(str.s, "RangeError")
     ELSE ReadIntlOptions(str.s, options, list, i + 1, acc @@ (option.key :> Val(str).value))

\* The constructor of a service of IntlConstructorOptions: OrdinaryCreateFromConstructor, then
\* CanonicalizeLocaleList and the options, which DisplayNames, ListFormat, and Segmenter take as
\* GetOptionsObject does and the others as CoerceOptionsToObject does. The object holds them, as no method reads them without
\* the locale data that ResolveLocale reads.
IntlConstruct(s, service, newTarget, locales, options) ==
  LET o == OrdinaryCreateFromConstructor(s, newTarget, "Intl" \o service \o "Prototype", "intl" \o service,
                                         [locales |-> <<>>, options |-> Empty]) IN IF IsAbrupt(o) THEN o ELSE
  LET requested == CanonicalizeLocaleList(o.s, locales) IN IF IsAbrupt(requested) THEN requested ELSE
  LET opts == CASE options = Undefined -> OrdinaryObjectCreate(requested.s, Null)
                [] service \in {"DisplayNames", "ListFormat", "Segmenter"} /\ ~IsObject(options) -> ThrowTypeError(requested.s)
                [] OTHER -> ToObject(requested.s, options)
  IN IF IsAbrupt(opts) THEN opts ELSE
  LET read == ReadIntlOptions(opts.s, Val(opts), IntlConstructorOptions[service], 1, <<>>) IN IF IsAbrupt(read) THEN read
  ELSE IF service = "DateTimeFormat" /\ IsDateTimeFormatConflict(Val(read)) THEN ThrowTypeError(read.s)
  ELSE Ok(SetSlots(read.s, Val(o), [locales |-> Val(requested), options |-> Val(read)]), Val(o))

\* CreateDateTimeFormat's TypeError, where a date or time style comes with an explicit format
\* component, of options read as IntlConstruct reads them.
IsDateTimeFormatConflict(read) ==
  LET styled == read[SV("dateStyle")] # Empty \/ read[SV("timeStyle")] # Empty
      components == {DateTimeFormatOptions[i].property : i \in 1..11}
  IN styled /\ \E key \in components : read[key] # Empty

\* CanonicalizeLocaleList (ECMA-402 §9.2.1), as a list of canonical tags, which reads whether a tag
\* is valid and its canonical form from HostLocale. A list longer than any a program makes stops,
\* which would take that many steps to walk.
CanonicalizeLocaleList(s, locales) ==
  IF locales = Undefined THEN Ok(s, <<>>)
  ELSE IF IsString(locales) THEN CanonicalizeLocale(s, locales.value, <<>>)
  ELSE IF IsObject(locales) /\ O(s, locales).class = "intlLocale" THEN Ok(s, <<O(s, locales).slots.tag>>) ELSE
  LET o == ToObject(s, locales) IN IF IsAbrupt(o) THEN o ELSE
  LET len == LengthOfArrayLike(o.s, Val(o)) IN IF IsAbrupt(len) THEN len
  ELSE IF NumLess(NumFromInt(10000000), Val(len).value) THEN Unsupported(len.s, N("Unsupported: a long list of locales"))
  ELSE CanonicalizeLocalesFrom(len.s, Val(o), 0, NumToSmallInt(Val(len).value), <<>>)
CanonicalizeLocalesFrom(s, o, k, len, seen) ==
  IF k = len THEN Ok(s, seen) ELSE
  LET key == Str(NumToString(NumFromInt(k)))
      present == HasProperty(s, o, key)
  IN IF IsAbrupt(present) THEN present
     ELSE IF Val(present) = False THEN CanonicalizeLocalesFrom(present.s, o, k + 1, len, seen) ELSE
     LET value == Get(present.s, o, key) IN IF IsAbrupt(value) THEN value
     ELSE IF ~IsString(Val(value)) /\ ~IsObject(Val(value)) THEN ThrowTypeError(value.s)
     \* A Locale's tag is canonical.
     ELSE IF IsObject(Val(value)) /\ O(value.s, Val(value)).class = "intlLocale" THEN
       CanonicalizeLocalesFrom(value.s, o, k + 1, len,
                               IF O(value.s, Val(value)).slots.tag \in Range(seen) THEN seen ELSE Append(seen, O(value.s, Val(value)).slots.tag))
     ELSE
     LET tag == ToStr(value.s, Val(value)) IN IF IsAbrupt(tag) THEN tag ELSE
     LET added == CanonicalizeLocale(tag.s, Val(tag).value, seen) IN IF IsAbrupt(added) THEN added
     ELSE CanonicalizeLocalesFrom(added.s, o, k + 1, len, Val(added))
\* A tag's canonical form appended to seen where it isn't there yet: IsStructurallyValidLanguageTag
\* and CanonicalizeUnicodeLocaleId, as the host answers them.
CanonicalizeLocale(s, tag, seen) ==
  LET host == HostLocale(tag) IN
  CASE host.found = "invalid" -> ThrowError(s, "RangeError")
    [] host.found = "locale" -> Ok(s, IF host.canonical \in Range(seen) THEN seen ELSE Append(seen, host.canonical))
    [] OTHER -> Unsupported(s, N("Unsupported: a locale the host's table leaves out"))

\* The supportedLocalesOf of a constructor, FilterLocales: the requested locales that the host
\* supports for the constructor's service, by the localeMatcher option.
FilterLocales(s, service, requested, options) ==
  LET o == IF options = Undefined THEN OrdinaryObjectCreate(s, Null) ELSE ToObject(s, options) IN IF IsAbrupt(o) THEN o ELSE
  LET matcher == GetStringOption(o.s, Val(o), SV("localeMatcher"), {N("lookup"), N("best fit")}, N("best fit")) IN
  IF IsAbrupt(matcher) THEN matcher ELSE
  LET hosts == [i \in DOMAIN requested |-> HostLocale(requested[i])]
      supported(i) == service \in (IF Val(matcher) = N("lookup") THEN hosts[i].lookup ELSE hosts[i].bestFit)
  IN IF \E i \in DOMAIN requested : hosts[i].found # "locale" \/ service \in hosts[i].differs
     THEN Unsupported(matcher.s, N("Unsupported: a locale the host's table leaves out"))
     ELSE CreateArrayFromList(matcher.s, [i \in 1..Len(SelectSeq([j \in DOMAIN requested |-> j], supported)) |->
                                          Str(requested[SelectSeq([j \in DOMAIN requested |-> j], supported)[i]])])

\* GetOption of a string option that takes any value, as its units, or Empty where it's undefined.
GetAnyStringOption(s, options, key) ==
  LET value == Get(s, options, key) IN IF IsAbrupt(value) THEN value
  ELSE IF Val(value) = Undefined THEN Ok(value.s, Empty)
  ELSE LET str == ToStr(value.s, Val(value)) IN IF IsAbrupt(str) THEN str ELSE Ok(str.s, Val(str).value)

\* DefaultNumberOption (§9.2.13) and GetNumberOption (§9.2.14).
DefaultNumberOption(s, value, minimum, maximum, fallback) ==
  IF value = Undefined THEN Ok(s, fallback) ELSE
  LET n == ToNumber(s, value) IN IF IsAbrupt(n) THEN n
  ELSE IF ~NumIsFinite(Val(n).value) \/ NumLessThan(Val(n).value, NumFromInt(minimum)) \/
          NumLessThan(NumFromInt(maximum), Val(n).value)
  THEN ThrowError(n.s, "RangeError") ELSE Ok(n.s, NumToInt(MathFloor(Val(n).value)))
GetNumberOption(s, options, key, minimum, maximum, fallback) ==
  LET value == Get(s, options, key) IN IF IsAbrupt(value) THEN value
  ELSE DefaultNumberOption(value.s, Val(value), minimum, maximum, fallback)

\* IsWellFormedCurrencyCode (§6.3.1), the ASCII-uppercase of units, and IsWellFormedUnitIdentifier
\* (§6.6.1) with the single units that Table 2 sanctions.
ASCIIUpper(u) == [i \in DOMAIN u |-> IF u[i] >= 97 /\ u[i] <= 122 THEN u[i] - 32 ELSE u[i]]
IsWellFormedCurrencyCode(u) == Len(u) = 3 /\ \A i \in 1..3 : ASCIIUpper(u)[i] >= 65 /\ ASCIIUpper(u)[i] <= 90
SanctionedUnits ==
  {N("acre"), N("bit"), N("byte"), N("celsius"), N("centimeter"), N("day"), N("degree"), N("fahrenheit"),
   N("fluid-ounce"), N("foot"), N("gallon"), N("gigabit"), N("gigabyte"), N("gram"), N("hectare"), N("hour"),
   N("inch"), N("kilobit"), N("kilobyte"), N("kilogram"), N("kilometer"), N("liter"), N("megabit"),
   N("megabyte"), N("meter"), N("microsecond"), N("mile"), N("mile-scandinavian"), N("milliliter"),
   N("millimeter"), N("millisecond"), N("minute"), N("month"), N("nanosecond"), N("ounce"), N("percent"),
   N("petabyte"), N("pound"), N("second"), N("stone"), N("terabit"), N("terabyte"), N("week"), N("yard"),
   N("year")}
IsWellFormedUnitIdentifier(u) ==
  \/ u \in SanctionedUnits
  \/ \E i \in 1..(Len(u) - 4) : SubSeq(u, i, i + 4) = N("-per-") /\ SubSeq(u, 1, i - 1) \in SanctionedUnits /\
                          SubSeq(u, i + 5, Len(u)) \in SanctionedUnits

\* SetNumberFormatUnitOptions (§16.1.3): the style, and the currency's and the unit's options, each
\* Empty where the style doesn't use it.
NumberFormatUnitOptions(s, options) ==
  LET style == GetStringOption(s, options, SV("style"), {N("decimal"), N("percent"), N("currency"), N("unit")}, N("decimal")) IN
  IF IsAbrupt(style) THEN style ELSE
  LET currency == GetAnyStringOption(style.s, options, SV("currency")) IN IF IsAbrupt(currency) THEN currency
  ELSE IF Val(currency) = Empty /\ Val(style) = N("currency") THEN ThrowTypeError(currency.s)
  ELSE IF Val(currency) # Empty /\ ~IsWellFormedCurrencyCode(Val(currency)) THEN ThrowError(currency.s, "RangeError") ELSE
  LET currencyDisplay == GetStringOption(currency.s, options, SV("currencyDisplay"), {N("code"), N("symbol"), N("narrowSymbol"), N("name")}, N("symbol")) IN
  IF IsAbrupt(currencyDisplay) THEN currencyDisplay ELSE
  LET currencySign == GetStringOption(currencyDisplay.s, options, SV("currencySign"), {N("standard"), N("accounting")}, N("standard")) IN
  IF IsAbrupt(currencySign) THEN currencySign ELSE
  LET unit == GetAnyStringOption(currencySign.s, options, SV("unit")) IN IF IsAbrupt(unit) THEN unit
  ELSE IF Val(unit) = Empty /\ Val(style) = N("unit") THEN ThrowTypeError(unit.s)
  ELSE IF Val(unit) # Empty /\ ~IsWellFormedUnitIdentifier(Val(unit)) THEN ThrowError(unit.s, "RangeError") ELSE
  LET unitDisplay == GetStringOption(unit.s, options, SV("unitDisplay"), {N("short"), N("narrow"), N("long")}, N("short")) IN
  IF IsAbrupt(unitDisplay) THEN unitDisplay ELSE
  LET isCurrency == Val(style) = N("currency")
      isUnit == Val(style) = N("unit")
  IN Ok(unitDisplay.s, [style |-> Val(style),
                        currency |-> IF isCurrency THEN ASCIIUpper(Val(currency)) ELSE Empty,
                        currencyDisplay |-> IF isCurrency THEN Val(currencyDisplay) ELSE Empty,
                        currencySign |-> IF isCurrency THEN Val(currencySign) ELSE Empty,
                        unit |-> IF isUnit THEN Val(unit) ELSE Empty,
                        unitDisplay |-> IF isUnit THEN Val(unitDisplay) ELSE Empty])

\* SetNumberFormatDigitOptions (§16.1.2): the digit options, each Empty where it's undefined, with
\* the rounding priority that resolvedOptions gives.
NumberFormatDigitOptions(s, options, minDefault, maxDefault, notation) ==
  LET minInteger == GetNumberOption(s, options, SV("minimumIntegerDigits"), 1, 21, 1) IN IF IsAbrupt(minInteger) THEN minInteger ELSE
  LET minFD == Get(minInteger.s, options, SV("minimumFractionDigits")) IN IF IsAbrupt(minFD) THEN minFD ELSE
  LET maxFD == Get(minFD.s, options, SV("maximumFractionDigits")) IN IF IsAbrupt(maxFD) THEN maxFD ELSE
  LET minSD == Get(maxFD.s, options, SV("minimumSignificantDigits")) IN IF IsAbrupt(minSD) THEN minSD ELSE
  LET maxSD == Get(minSD.s, options, SV("maximumSignificantDigits")) IN IF IsAbrupt(maxSD) THEN maxSD ELSE
  LET increment == GetNumberOption(maxSD.s, options, SV("roundingIncrement"), 1, 5000, 1) IN IF IsAbrupt(increment) THEN increment
  ELSE IF Val(increment) \notin {1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000} THEN ThrowError(increment.s, "RangeError") ELSE
  LET mode == GetStringOption(increment.s, options, SV("roundingMode"),
                              {N("ceil"), N("floor"), N("expand"), N("trunc"), N("halfCeil"), N("halfFloor"), N("halfExpand"),
                               N("halfTrunc"), N("halfEven")}, N("halfExpand")) IN IF IsAbrupt(mode) THEN mode ELSE
  LET priority == GetStringOption(mode.s, options, SV("roundingPriority"), {N("auto"), N("morePrecision"), N("lessPrecision")}, N("auto")) IN
  IF IsAbrupt(priority) THEN priority ELSE
  LET trailing == GetStringOption(priority.s, options, SV("trailingZeroDisplay"), {N("auto"), N("stripIfInteger")}, N("auto")) IN
  IF IsAbrupt(trailing) THEN trailing ELSE
  LET maxDefaultFD == IF Val(increment) # 1 THEN minDefault ELSE maxDefault
      hasSD == Val(minSD) # Undefined \/ Val(maxSD) # Undefined
      hasFD == Val(minFD) # Undefined \/ Val(maxFD) # Undefined
      isAuto == Val(priority) = N("auto")
      needSD == ~isAuto \/ hasSD
      needFD == ~isAuto \/ (~hasSD /\ (hasFD \/ notation # N("compact")))
      resolvedMinSD == IF needSD /\ hasSD THEN DefaultNumberOption(trailing.s, Val(minSD), 1, 21, 1) ELSE Ok(trailing.s, 1)
  IN IF IsAbrupt(resolvedMinSD) THEN resolvedMinSD ELSE
  LET resolvedMaxSD == IF needSD /\ hasSD THEN DefaultNumberOption(resolvedMinSD.s, Val(maxSD), Val(resolvedMinSD), 21, 21)
                       ELSE Ok(resolvedMinSD.s, 21) IN
  IF IsAbrupt(resolvedMaxSD) THEN resolvedMaxSD ELSE
  LET givenMinFD == IF needFD /\ hasFD THEN DefaultNumberOption(resolvedMaxSD.s, Val(minFD), 0, 100, Empty) ELSE Ok(resolvedMaxSD.s, Empty) IN
  IF IsAbrupt(givenMinFD) THEN givenMinFD ELSE
  LET givenMaxFD == IF needFD /\ hasFD THEN DefaultNumberOption(givenMinFD.s, Val(maxFD), 0, 100, Empty) ELSE Ok(givenMinFD.s, Empty) IN
  IF IsAbrupt(givenMaxFD) THEN givenMaxFD ELSE
  LET lo == Val(givenMinFD)
      hi == Val(givenMaxFD)
      fd == CASE ~hasFD -> <<minDefault, maxDefaultFD>>
              [] lo = Empty -> <<IF minDefault < hi THEN minDefault ELSE hi, hi>>
              [] hi = Empty -> <<lo, IF maxDefaultFD > lo THEN maxDefaultFD ELSE lo>>
              [] OTHER -> <<lo, hi>>
      neither == ~needSD /\ ~needFD
      type == CASE neither \/ Val(priority) = N("morePrecision") -> "morePrecision"
                [] Val(priority) = N("lessPrecision") -> "lessPrecision"
                [] hasSD -> "significantDigits"
                [] OTHER -> "fractionDigits"
      result == [minimumIntegerDigits |-> Val(minInteger),
                 minimumFractionDigits |-> CASE neither -> 0 [] needFD -> fd[1] [] OTHER -> Empty,
                 maximumFractionDigits |-> CASE neither -> 0 [] needFD -> fd[2] [] OTHER -> Empty,
                 minimumSignificantDigits |-> CASE neither -> 1 [] needSD -> Val(resolvedMinSD) [] OTHER -> Empty,
                 maximumSignificantDigits |-> CASE neither -> 2 [] needSD -> Val(resolvedMaxSD) [] OTHER -> Empty,
                 roundingIncrement |-> Val(increment), roundingMode |-> Val(mode),
                 roundingPriority |-> CASE type = "morePrecision" -> N("morePrecision") [] type = "lessPrecision" -> N("lessPrecision") [] OTHER -> N("auto"),
                 trailingZeroDisplay |-> Val(trailing), isNeither |-> neither]
  IN CASE needFD /\ hasFD /\ lo # Empty /\ hi # Empty /\ lo > hi -> ThrowError(givenMaxFD.s, "RangeError")
       [] Val(increment) # 1 /\ type # "fractionDigits" -> ThrowTypeError(givenMaxFD.s)
       [] Val(increment) # 1 /\ result.maximumFractionDigits # result.minimumFractionDigits -> ThrowError(givenMaxFD.s, "RangeError")
       [] OTHER -> Ok(givenMaxFD.s, result)

\* The constructor of Intl.NumberFormat (§16.1.1), whose object holds its requested locales and its
\* options as resolvedOptions gives them but for the locale and the numbering system, which
\* ResolveLocale reads from locale data: the key of HostIntl's entries for the object.
NumberFormatConstruct(s, newTarget, locales, options) ==
  LET o == OrdinaryCreateFromConstructor(s, newTarget, "IntlNumberFormatPrototype", "intlNumberFormat",
                                         [locales |-> <<>>, options |-> Empty, boundFormat |-> Undefined]) IN IF IsAbrupt(o) THEN o ELSE
  LET requested == CanonicalizeLocaleList(o.s, locales) IN IF IsAbrupt(requested) THEN requested ELSE
  LET opts == IF options = Undefined THEN OrdinaryObjectCreate(requested.s, Null) ELSE ToObject(requested.s, options) IN
  IF IsAbrupt(opts) THEN opts ELSE
  LET matcher == GetStringOption(opts.s, Val(opts), SV("localeMatcher"), {N("lookup"), N("best fit")}, N("best fit")) IN
  IF IsAbrupt(matcher) THEN matcher ELSE
  LET nu == GetAnyStringOption(matcher.s, Val(opts), SV("numberingSystem")) IN IF IsAbrupt(nu) THEN nu
  ELSE IF Val(nu) # Empty /\ ~IsTypeSequenceFrom(Val(nu), 1, 0) THEN ThrowError(nu.s, "RangeError") ELSE
  LET units == NumberFormatUnitOptions(nu.s, Val(opts)) IN IF IsAbrupt(units) THEN units ELSE
  LET notation == GetStringOption(units.s, Val(opts), SV("notation"), {N("standard"), N("scientific"), N("engineering"), N("compact")}, N("standard")) IN
  IF IsAbrupt(notation) THEN notation ELSE
  LET style == Val(units).style
      digits == IF style = N("currency") /\ Val(notation) = N("standard") THEN HostIntl(<<"currencyDigits", Val(units).currency>>) ELSE Empty
  IN IF digits # Empty /\ digits.found # "digits" THEN Unsupported(notation.s, N("Unsupported: a currency the host's table leaves out")) ELSE
  LET defaults == CASE digits # Empty -> <<digits.digits, digits.digits>> [] style = N("percent") -> <<0, 0>> [] OTHER -> <<0, 3>>
      rounding == NumberFormatDigitOptions(notation.s, Val(opts), defaults[1], defaults[2], Val(notation))
  IN IF IsAbrupt(rounding) THEN rounding ELSE
  LET compact == GetStringOption(rounding.s, Val(opts), SV("compactDisplay"), {N("short"), N("long")}, N("short")) IN
  IF IsAbrupt(compact) THEN compact ELSE
  LET isCompact == Val(notation) = N("compact")
      groupingDefault == IF isCompact THEN N("min2") ELSE N("auto")
      grouping == Get(compact.s, Val(opts), SV("useGrouping"))
  IN IF IsAbrupt(grouping) THEN grouping ELSE
  LET groupingText == IF Val(grouping) \in {Undefined, True} \/ ~ToBooleanValue(Val(grouping)) THEN Ok(grouping.s, Empty)
                      ELSE ToStr(grouping.s, Val(grouping)) IN
  IF IsAbrupt(groupingText) THEN groupingText
  ELSE IF Val(groupingText) # Empty /\ Val(groupingText).value \notin {N("min2"), N("auto"), N("always"), N("true"), N("false")}
  THEN ThrowError(groupingText.s, "RangeError") ELSE
  LET useGrouping == CASE Val(grouping) = Undefined -> groupingDefault
                       [] Val(grouping) = True -> N("always")
                       \* false, as units the key tells from the strings that useGrouping may be.
                       [] ~ToBooleanValue(Val(grouping)) -> N("false")
                       [] Val(groupingText).value \in {N("true"), N("false")} -> groupingDefault
                       [] OTHER -> Val(groupingText).value
      sign == GetStringOption(groupingText.s, Val(opts), SV("signDisplay"), {N("auto"), N("never"), N("always"), N("exceptZero"), N("negative")}, N("auto"))
  IN IF IsAbrupt(sign) THEN sign ELSE
  LET u == Val(units)
      r == Val(rounding)
      config == <<Val(requested), Val(matcher), Val(nu),
                  <<u.style, u.currency, u.currencyDisplay, u.currencySign, u.unit, u.unitDisplay, r.minimumIntegerDigits,
                    r.minimumFractionDigits, r.maximumFractionDigits, r.minimumSignificantDigits, r.maximumSignificantDigits,
                    useGrouping, Val(notation), IF isCompact THEN Val(compact) ELSE Empty, Val(sign), r.roundingIncrement,
                    r.roundingMode, r.roundingPriority, r.trailingZeroDisplay>>>>
  IN Ok(SetSlots(sign.s, Val(o), [locales |-> Val(requested), options |-> config]), Val(o))

\* ToIntlMathematicalValue (§16.5.16), as the key of the value in HostIntl's entries: a BigInt's
\* or a string's units, or a Number's, with whether it's -0.
IntlMathematicalKey(s, value) ==
  LET p == ToPrimitive(s, value, "number") IN IF IsAbrupt(p) THEN p
  ELSE IF IsBigInt(Val(p)) THEN LET t == ToStr(p.s, Val(p)) IN IF IsAbrupt(t) THEN t ELSE Ok(t.s, <<"bigint", Val(t).value>>)
  \* A string that isn't a StringNumericLiteral is NaN, and "Infinity" is infinite, as a Number of them is.
  ELSE IF IsString(Val(p)) THEN
    LET n == StringToNumber(Val(p).value) IN
    Ok(p.s, IF ~NumIsFinite(n) THEN <<"number", NumToString(n), FALSE>> ELSE <<"string", Val(p).value>>)
  ELSE LET n == ToNumber(p.s, Val(p)) IN IF IsAbrupt(n) THEN n
  ELSE Ok(n.s, <<"number", NumToString(Val(n).value), Val(n).value.k = "nzero">>)

\* The answer of HostIntl to a service's method of an object of options config with arguments
\* args, which stops where the host's table leaves it out.
IntlAnswer(s, service, config, method, args) ==
  LET answer == HostIntl(<<service, config, method, args>>) IN
  CASE answer.found = "error" -> ThrowError(s, answer.error)
    [] answer.found \in {"options", "parts", "value", "array", "segments"} -> Ok(s, answer)
    [] OTHER -> Unsupported(s, N("Unsupported: a value the host's Intl table leaves out"))

\* Number.prototype.toLocaleString and BigInt.prototype.toLocaleString (ECMA-402 §20.2.1, §20.3.1)
\* of a value's key: the format of a new Intl.NumberFormat.
IntlToLocaleString(s, key, locales, options) ==
  LET nf == NumberFormatConstruct(s, Intrinsic(s, "IntlNumberFormat"), locales, options) IN IF IsAbrupt(nf) THEN nf ELSE
  LET answer == IntlAnswer(nf.s, "NumberFormat", O(nf.s, Val(nf)).slots.options, "formatToParts", <<key>>) IN
  IF IsAbrupt(answer) THEN answer ELSE IntlResult(answer.s, "format", Val(answer))

\* An object of the parts of a formatted value, each a sequence of a property's units and its
\* value's, and an array of them.
IntlPartObject(s, part) ==
  LET o == OrdinaryObjectCreate(s, Intrinsic(s, "ObjectPrototype")) IN
  Ok(SetO(o.s, Val(o), WithDataProps(O(o.s, Val(o)), [i \in DOMAIN part |-> <<Str(part[i][1]), Str(part[i][2])>>])), Val(o))
IntlPartObjects(s, parts, i, acc) ==
  IF i > Len(parts) THEN CreateArrayFromList(s, acc)
  ELSE LET o == IntlPartObject(s, parts[i]) IN IntlPartObjects(o.s, parts, i + 1, Append(acc, Val(o)))
IntlPartsText(parts, i) ==
  IF i > Len(parts) THEN <<>>
  ELSE LET part == parts[i] IN SelectSeq(part, LAMBDA pair : pair[1] = N("value"))[1][2] \o IntlPartsText(parts, i + 1)

\* An object of resolved options, whose pairs are each a property's units and its value, or a
\* record of the elements of an array, which pairs holds.
IntlOptionsObject(s, pairs, i, acc) ==
  IF i > Len(pairs) THEN
    LET o == OrdinaryObjectCreate(s, Intrinsic(s, "ObjectPrototype")) IN Ok(SetO(o.s, Val(o), WithDataProps(O(o.s, Val(o)), acc)), Val(o))
  ELSE IF "elements" \in DOMAIN pairs[i][2] THEN
    LET a == CreateArrayFromList(s, pairs[i][2].elements) IN
    IntlOptionsObject(a.s, pairs, i + 1, Append(acc, <<Str(pairs[i][1]), Val(a)>>))
  ELSE IntlOptionsObject(s, pairs, i + 1, Append(acc, <<Str(pairs[i][1]), pairs[i][2]>>))

\* An answer as the value that the method returns: a formatted string or its parts, or an object
\* of resolved options, whose pairs are each a property's units and its value.
IntlResult(s, method, answer) ==
  CASE answer.found = "value" -> Ok(s, answer.value)
    [] answer.found = "array" -> CreateArrayFromList(s, answer.elements)
    [] answer.found = "options" /\ method # "resolvedOptions" -> IntlOptionsObject(s, answer.pairs, 1, <<>>)
    [] method = "resolvedOptions" -> IntlOptionsObject(s, answer.pairs, 1, <<>>)
    [] method \in {"formatToParts", "formatRangeToParts"} -> IntlPartObjects(s, answer.parts, 1, <<>>)
    [] OTHER -> Ok(s, Str(IntlPartsText(answer.parts, 1)))

\* The methods of an Intl.NumberFormat, nf, whose format is a function bound to it.
NumberFormatMethod(s, f, m, nf, args) ==
  LET config == O(s, nf).slots.options IN
  CASE m = "NumberFormat.resolvedOptions" ->
         LET answer == IntlAnswer(s, "NumberFormat", config, "resolvedOptions", <<>>) IN
         IF IsAbrupt(answer) THEN answer ELSE IntlResult(answer.s, "resolvedOptions", Val(answer))
    [] m = "NumberFormat.format" ->
         IF O(s, nf).slots.boundFormat # Undefined THEN Ok(s, O(s, nf).slots.boundFormat) ELSE
         LET bound == CreateBuiltinFunction(s, <<"Intl", "NumberFormat.boundFormat">>, 1, <<>>, nf) IN
         Ok(SetSlots(bound.s, nf, [boundFormat |-> Val(bound)]), Val(bound))
    [] m \in {"NumberFormat.boundFormat", "NumberFormat.formatToParts"} ->
         LET x == IntlMathematicalKey(s, Arg(args, 1)) IN IF IsAbrupt(x) THEN x ELSE
         LET method == IF m = "NumberFormat.boundFormat" THEN "format" ELSE "formatToParts"
             answer == IntlAnswer(x.s, "NumberFormat", config, "formatToParts", <<Val(x)>>)
         IN IF IsAbrupt(answer) THEN answer ELSE IntlResult(answer.s, method, Val(answer))
    [] OTHER ->
         IF Arg(args, 1) = Undefined \/ Arg(args, 2) = Undefined THEN ThrowTypeError(s) ELSE
         LET x == IntlMathematicalKey(s, Arg(args, 1)) IN IF IsAbrupt(x) THEN x ELSE
         LET y == IntlMathematicalKey(x.s, Arg(args, 2)) IN IF IsAbrupt(y) THEN y ELSE
         LET method == IF m = "NumberFormat.formatRange" THEN "formatRange" ELSE "formatRangeToParts"
             answer == IntlAnswer(y.s, "NumberFormat", config, "formatRangeToParts", <<Val(x), Val(y)>>)
         IN IF IsAbrupt(answer) THEN answer ELSE IntlResult(answer.s, method, Val(answer))
NumberFormatMethods ==
  {"NumberFormat.resolvedOptions", "NumberFormat.format", "NumberFormat.formatToParts", "NumberFormat.formatRange",
   "NumberFormat.formatRangeToParts"}

\* The constructor of Intl.PluralRules (§17.1.1), whose object holds its requested locales and its
\* options as a NumberFormat's does, but for the fraction digits of the notation that needs none,
\* which resolvedOptions leaves out.
PluralRulesConstruct(s, newTarget, locales, options) ==
  LET o == OrdinaryCreateFromConstructor(s, newTarget, "IntlPluralRulesPrototype", "intlPluralRules",
                                         [locales |-> <<>>, options |-> Empty]) IN IF IsAbrupt(o) THEN o ELSE
  LET requested == CanonicalizeLocaleList(o.s, locales) IN IF IsAbrupt(requested) THEN requested ELSE
  LET opts == IF options = Undefined THEN OrdinaryObjectCreate(requested.s, Null) ELSE ToObject(requested.s, options) IN
  IF IsAbrupt(opts) THEN opts ELSE
  LET matcher == GetStringOption(opts.s, Val(opts), SV("localeMatcher"), {N("lookup"), N("best fit")}, N("best fit")) IN
  IF IsAbrupt(matcher) THEN matcher ELSE
  LET type == GetStringOption(matcher.s, Val(opts), SV("type"), {N("cardinal"), N("ordinal")}, N("cardinal")) IN
  IF IsAbrupt(type) THEN type ELSE
  LET notation == GetStringOption(type.s, Val(opts), SV("notation"), {N("standard"), N("scientific"), N("engineering"), N("compact")}, N("standard")) IN
  IF IsAbrupt(notation) THEN notation ELSE
  LET compact == GetStringOption(notation.s, Val(opts), SV("compactDisplay"), {N("short"), N("long")}, N("short")) IN
  IF IsAbrupt(compact) THEN compact ELSE
  LET rounding == NumberFormatDigitOptions(compact.s, Val(opts), 0, 3, Val(notation)) IN IF IsAbrupt(rounding) THEN rounding ELSE
  LET r == Val(rounding)
      config == <<Val(requested), Val(matcher),
                  <<Val(type), Val(notation), IF Val(notation) = N("compact") THEN Val(compact) ELSE Empty, r.minimumIntegerDigits,
                    IF r.isNeither THEN Empty ELSE r.minimumFractionDigits, IF r.isNeither THEN Empty ELSE r.maximumFractionDigits,
                    r.minimumSignificantDigits, r.maximumSignificantDigits, r.roundingIncrement, r.roundingMode, r.roundingPriority,
                    r.trailingZeroDisplay>>>>
  IN Ok(SetSlots(rounding.s, Val(o), [locales |-> Val(requested), options |-> config]), Val(o))

\* The key of HostIntl's entries for an Intl object that IntlConstruct made: its requested locales
\* and each of its options, in the order its constructor reads them.
IntlConstructedConfig(s, o, service) ==
  LET slots == O(s, o).slots
      list == IntlConstructorOptions[service]
  IN <<slots.locales, [i \in 1..Len(list) |-> slots.options[list[i].key]]>>

\* StringListFromIterable (§14.5.3), the strings of an iterable, which closes its iterator at a
\* value that isn't one.
StringListFrom(s, it, acc) ==
  LET next == IteratorStepValue(s, it) IN IF IsAbrupt(next) THEN next
  ELSE IF Val(next).done THEN Ok(next.s, acc)
  ELSE IF ~IsString(Val(next).value) THEN LET e == ThrowTypeError(next.s) IN IteratorClose(e.s, it, e.c)
  ELSE StringListFrom(next.s, it, Append(acc, Val(next).value.value))
StringListFromIterable(s, iterable) ==
  IF iterable = Undefined THEN Ok(s, <<>>) ELSE
  LET it == GetIterator(s, iterable, "sync") IN IF IsAbrupt(it) THEN it ELSE StringListFrom(it.s, Val(it), <<>>)

\* A method's arguments as the key of HostIntl's entries, after the conversions it makes of them.
IntlNumberKey(n) == <<"number", NumToString(n), n.k = "nzero">>
IntlMethodArguments(s, m, args) ==
  CASE m \in {"Collator.boundCompare"} ->
         LET x == ToStr(s, Arg(args, 1)) IN IF IsAbrupt(x) THEN x ELSE
         LET y == ToStr(x.s, Arg(args, 2)) IN IF IsAbrupt(y) THEN y ELSE Ok(y.s, <<Val(x).value, Val(y).value>>)
    [] m \in {"ListFormat.format", "ListFormat.formatToParts"} ->
         LET list == StringListFromIterable(s, Arg(args, 1)) IN IF IsAbrupt(list) THEN list ELSE Ok(list.s, <<Val(list)>>)
    [] m \in {"RelativeTimeFormat.format", "RelativeTimeFormat.formatToParts"} ->
         LET value == ToNumber(s, Arg(args, 1)) IN IF IsAbrupt(value) THEN value ELSE
         LET unit == ToStr(value.s, Arg(args, 2)) IN IF IsAbrupt(unit) THEN unit
         ELSE Ok(unit.s, <<IntlNumberKey(Val(value).value), Val(unit).value>>)
    [] m = "DisplayNames.of" ->
         LET code == ToStr(s, Arg(args, 1)) IN IF IsAbrupt(code) THEN code ELSE Ok(code.s, <<Val(code).value>>)
    [] m = "PluralRules.select" ->
         LET value == ToNumber(s, Arg(args, 1)) IN IF IsAbrupt(value) THEN value ELSE Ok(value.s, <<IntlNumberKey(Val(value).value)>>)
    [] m = "PluralRules.selectRange" ->
         IF Arg(args, 1) = Undefined \/ Arg(args, 2) = Undefined THEN ThrowTypeError(s) ELSE
         LET x == ToNumber(s, Arg(args, 1)) IN IF IsAbrupt(x) THEN x ELSE
         LET y == ToNumber(x.s, Arg(args, 2)) IN IF IsAbrupt(y) THEN y
         ELSE Ok(y.s, <<IntlNumberKey(Val(x).value), IntlNumberKey(Val(y).value)>>)
    [] OTHER -> Ok(s, <<>>)

\* The methods of the Intl objects other than a NumberFormat that HostIntl answers, of o, whose
\* Collator's compare is a function bound to it.
IntlHostMethods ==
  {"Collator.resolvedOptions", "Collator.compare", "ListFormat.format", "ListFormat.formatToParts",
   "ListFormat.resolvedOptions", "RelativeTimeFormat.format", "RelativeTimeFormat.formatToParts",
   "RelativeTimeFormat.resolvedOptions", "DisplayNames.of", "DisplayNames.resolvedOptions",
   "Segmenter.resolvedOptions", "PluralRules.select", "PluralRules.selectRange", "PluralRules.resolvedOptions"}
IntlHostMethod(s, m, o, args) ==
  LET service == IF m = "Collator.boundCompare" THEN "Collator" ELSE IntlMethodServices[m]
      config == IF service = "PluralRules" THEN O(s, o).slots.options ELSE IntlConstructedConfig(s, o, service)
      method == CASE m \in {"ListFormat.format", "RelativeTimeFormat.format"} -> "format"
                  [] m \in {"ListFormat.formatToParts", "RelativeTimeFormat.formatToParts"} -> "formatToParts"
                  [] m = "DisplayNames.of" -> "of"
                  [] m = "PluralRules.select" -> "select"
                  [] m = "PluralRules.selectRange" -> "selectRange"
                  [] m = "Collator.boundCompare" -> "boundCompare"
                  [] m = "Collator.compare" -> "compare"
                  [] OTHER -> "resolvedOptions"
  IN IF m = "Collator.compare" THEN
       IF "boundCompare" \in DOMAIN O(s, o).slots THEN Ok(s, O(s, o).slots.boundCompare) ELSE
       LET bound == CreateBuiltinFunction(s, <<"Intl", "Collator.boundCompare">>, 2, <<>>, o) IN
       Ok(SetSlots(bound.s, o, [boundCompare |-> Val(bound)]), Val(bound))
     ELSE
     LET key == IntlMethodArguments(s, m, args) IN IF IsAbrupt(key) THEN key ELSE
     LET asked == CASE method \in {"format", "formatToParts"} /\ service # "PluralRules" -> "formatToParts"
                    [] method = "boundCompare" -> "compare"
                    [] OTHER -> method
         answer == IntlAnswer(key.s, service, config, asked, Val(key))
     IN IF IsAbrupt(answer) THEN answer ELSE IntlResult(answer.s, method, Val(answer))

\* Whether units are a language, a script, or a region subtag (unicode_language_subtag and kin).
IsAlpha(c) == (c >= 65 /\ c <= 90) \/ (c >= 97 /\ c <= 122)
IsLanguageSubtag(u) == Len(u) \in {2, 3, 5, 6, 7, 8} /\ \A i \in DOMAIN u : IsAlpha(u[i])
IsScriptSubtag(u) == Len(u) = 4 /\ \A i \in DOMAIN u : IsAlpha(u[i])
IsRegionSubtag(u) ==
  \/ Len(u) = 2 /\ \A i \in DOMAIN u : IsAlpha(u[i])
  \/ Len(u) = 3 /\ \A i \in DOMAIN u : u[i] >= 48 /\ u[i] <= 57

\* The constructor of Intl.Locale (§15.1.1), as Node runs it: it reads the options in the spec's
\* order, rejects a language, a script, or a region subtag, an hour cycle, or a case first that
\* isn't one as it reads it, and the others where HostIntl's answer for the tag and the options
\* read does. The object holds that key and the tag of the locale.
LocaleConstruct(s, newTarget, tag, options) ==
  LET o == OrdinaryCreateFromConstructor(s, newTarget, "IntlLocalePrototype", "intlLocale",
                                         [locales |-> <<>>, options |-> Empty, tag |-> <<>>]) IN IF IsAbrupt(o) THEN o
  ELSE IF ~IsString(tag) /\ ~IsObject(tag) THEN ThrowTypeError(o.s) ELSE
  LET text == IF IsObject(tag) /\ O(o.s, tag).class = "intlLocale" THEN Ok(o.s, Str(O(o.s, tag).slots.tag)) ELSE ToStr(o.s, tag) IN
  IF IsAbrupt(text) THEN text ELSE
  LET opts == IF options = Undefined THEN OrdinaryObjectCreate(text.s, Null) ELSE ToObject(text.s, options) IN
  IF IsAbrupt(opts) THEN opts ELSE
  \* A Locale's tag is a valid one.
  LET host == IF IsObject(tag) /\ O(o.s, tag).class = "intlLocale" THEN [found |-> "locale"] ELSE HostLocale(Val(text).value) IN
  IF host.found = "invalid" THEN ThrowError(opts.s, "RangeError")
  ELSE IF host.found # "locale" THEN Unsupported(opts.s, N("Unsupported: a locale the host's table leaves out")) ELSE
  LET language == GetAnyStringOption(opts.s, Val(opts), SV("language")) IN IF IsAbrupt(language) THEN language
  ELSE IF Val(language) # Empty /\ ~IsLanguageSubtag(Val(language)) THEN ThrowError(language.s, "RangeError") ELSE
  LET script == GetAnyStringOption(language.s, Val(opts), SV("script")) IN IF IsAbrupt(script) THEN script
  ELSE IF Val(script) # Empty /\ ~IsScriptSubtag(Val(script)) THEN ThrowError(script.s, "RangeError") ELSE
  LET region == GetAnyStringOption(script.s, Val(opts), SV("region")) IN IF IsAbrupt(region) THEN region
  ELSE IF Val(region) # Empty /\ ~IsRegionSubtag(Val(region)) THEN ThrowError(region.s, "RangeError") ELSE
  LET calendar == GetAnyStringOption(region.s, Val(opts), SV("calendar")) IN IF IsAbrupt(calendar) THEN calendar ELSE
  LET collation == GetAnyStringOption(calendar.s, Val(opts), SV("collation")) IN IF IsAbrupt(collation) THEN collation ELSE
  LET week == GetAnyStringOption(collation.s, Val(opts), SV("firstDayOfWeek")) IN IF IsAbrupt(week) THEN week ELSE
  LET cycle == GetStringOption(week.s, Val(opts), SV("hourCycle"), {N("h11"), N("h12"), N("h23"), N("h24")}, Empty) IN
  IF IsAbrupt(cycle) THEN cycle ELSE
  LET first == GetStringOption(cycle.s, Val(opts), SV("caseFirst"), {N("upper"), N("lower"), N("false")}, Empty) IN
  IF IsAbrupt(first) THEN first ELSE
  LET numeric == Get(first.s, Val(opts), SV("numeric")) IN IF IsAbrupt(numeric) THEN numeric ELSE
  LET system == GetAnyStringOption(numeric.s, Val(opts), SV("numberingSystem")) IN IF IsAbrupt(system) THEN system ELSE
  LET config == <<Val(text).value,
                  <<Val(language), Val(script), Val(region), Val(calendar), Val(collation), Val(week), Val(cycle), Val(first),
                    IF Val(numeric) = Undefined THEN Empty ELSE ToBooleanValue(Val(numeric)), Val(system)>>>>
      answer == IntlAnswer(system.s, "Locale", config, "construct", <<>>)
  IN IF IsAbrupt(answer) THEN answer
     ELSE Ok(SetSlots(answer.s, Val(o), [options |-> config, tag |-> Val(answer).value.value]), Val(o))

\* The methods and accessors of an Intl.Locale, l, which HostIntl answers for its key: a value, an
\* array or an object of values, or for maximize and minimize, the tag of a new Intl.Locale.
LocaleMethods ==
  {"Locale.baseName", "Locale.calendar", "Locale.caseFirst", "Locale.collation", "Locale.firstDayOfWeek",
   "Locale.getCalendars", "Locale.getCollations", "Locale.getHourCycles", "Locale.getNumberingSystems",
   "Locale.getTextInfo", "Locale.getTimeZones", "Locale.getWeekInfo", "Locale.hourCycle", "Locale.language",
   "Locale.maximize", "Locale.minimize", "Locale.numberingSystem", "Locale.numeric", "Locale.region",
   "Locale.script", "Locale.toString"}
LocaleMethod(s, m, l) ==
  LET config == O(s, l).slots.options
      method == CASE m = "Locale.baseName" -> "baseName" [] m = "Locale.calendar" -> "calendar"
                  [] m = "Locale.caseFirst" -> "caseFirst" [] m = "Locale.collation" -> "collation"
                  [] m = "Locale.firstDayOfWeek" -> "firstDayOfWeek" [] m = "Locale.getCalendars" -> "getCalendars"
                  [] m = "Locale.getCollations" -> "getCollations" [] m = "Locale.getHourCycles" -> "getHourCycles"
                  [] m = "Locale.getNumberingSystems" -> "getNumberingSystems" [] m = "Locale.getTextInfo" -> "getTextInfo"
                  [] m = "Locale.getTimeZones" -> "getTimeZones" [] m = "Locale.getWeekInfo" -> "getWeekInfo"
                  [] m = "Locale.hourCycle" -> "hourCycle" [] m = "Locale.language" -> "language"
                  [] m = "Locale.maximize" -> "maximize" [] m = "Locale.minimize" -> "minimize"
                  [] m = "Locale.numberingSystem" -> "numberingSystem" [] m = "Locale.numeric" -> "numeric"
                  [] m = "Locale.region" -> "region" [] OTHER -> "script"
  IN IF m = "Locale.toString" THEN Ok(s, Str(O(s, l).slots.tag)) ELSE
     LET answer == IntlAnswer(s, "Locale", config, method, <<>>) IN IF IsAbrupt(answer) THEN answer
     ELSE IF method \in {"maximize", "minimize"} THEN
       \* Construct(%Intl.Locale%, « tag »), whose tag is a valid one and whose options are none.
       LET o == OrdinaryCreateFromConstructor(answer.s, Intrinsic(answer.s, "IntlLocale"), "IntlLocalePrototype", "intlLocale",
                                              [locales |-> <<>>, options |-> Empty, tag |-> <<>>])
           made == <<Val(answer).value.value, [i \in 1..10 |-> Empty]>>
           tag == IntlAnswer(o.s, "Locale", made, "construct", <<>>)
       IN IF IsAbrupt(tag) THEN tag ELSE Ok(SetSlots(tag.s, Val(o), [options |-> made, tag |-> Val(tag).value.value]), Val(o))
     ELSE IntlResult(answer.s, method, Val(answer))

\* The key of HostIntl's entries for an Intl.DateTimeFormat: IntlConstructedConfig's, with its time
\* zone's identifier for the time zone it read.
DateTimeFormatConfig(s, o) ==
  LET config == IntlConstructedConfig(s, o, "DateTimeFormat")
      read == config[2]
  IN <<config[1], [i \in DOMAIN read |-> IF IntlConstructorOptions.DateTimeFormat[i].kind = "timeZone" /\ read[i] # Empty
                                         THEN read[i].id ELSE read[i]]>>

\* ToDateTimeFormattable (ECMA-402 §11.5.10) as the key of HostIntl's entries: a Temporal object's,
\* or the Number of another value. undefined, whose time is now, stops.
DateTimeFormattableKey(s, value) ==
  IF value = Undefined THEN Unsupported(s, N("Unsupported: the time now"))
  ELSE IF IsObject(value) /\ O(s, value).class \in DOMAIN TemporalKinds THEN
    Ok(s, TemporalFormatKey(TemporalKinds[O(s, value).class], O(s, value).slots))
  ELSE LET n == ToNumber(s, value) IN IF IsAbrupt(n) THEN n ELSE Ok(n.s, IntlNumberKey(IntlTimeClip(Val(n).value)))

\* TimeClip (§21.4.1.31), whose -0 is +0, as FormatDateTime reads a Number.
IntlTimeClip(x) == LET t == TimeClip(x) IN IF NumIsZero(t) THEN NumFromInt(0) ELSE t

\* The text of a DateTimeFormat's format of a time value or a Temporal object, through the host's
\* recorded English pattern (HostDateFormat) for the options it read, where they are ones the table
\* records: English, no calendar or numbering system, and UTC, which is JS.tla's local time zone, of
\* a year from 1583 to 9999, or the error that the table records it throws. Else found is "none".
DateTimeFormatReadIndex ==
  [calendar |-> 2, numberingSystem |-> 3, hour12 |-> 4, hourCycle |-> 5, timeZone |-> 6, weekday |-> 7, era |-> 8,
   year |-> 9, month |-> 10, day |-> 11, dayPeriod |-> 12, hour |-> 13, minute |-> 14, second |-> 15,
   fractionalSecondDigits |-> 16, timeZoneName |-> 17, formatMatcher |-> 18, dateStyle |-> 19, timeStyle |-> 20]
DateTimeFormatRead(config, name) == config[2][DateTimeFormatReadIndex[name]]
\* A key of a time value, or of a Temporal object of a kind but an instant's or a zoned one's in the ISO
\* 8601 or the Gregorian calendar, as the kind its pattern is the host's table's under, its
\* calendar, and its date and time.
DateTimeFormatTarget(key) ==
  LET kind == key[1]
      hasDate == kind \in {"PlainDate", "PlainDateTime", "PlainYearMonth", "PlainMonthDay"}
      calendar == key[Len(key)]
      time == CASE kind = "PlainTime" -> SubSeq(key, 2, 5)
                [] kind = "PlainDateTime" -> SubSeq(key, 5, 8)
                [] OTHER -> <<0, 0, 0, 0>>
  IN CASE kind = "number" ->
            LET fields == DateFields(StringToNumber(key[2])) IN
            [found |-> TRUE, kind |-> "DateTimeFormat", calendar |-> "gregory",
             date |-> [year |-> fields.year, month |-> fields.month + 1, day |-> fields.date],
             time |-> <<fields.hour, fields.minute, fields.second, fields.ms>>]
       [] (hasDate /\ calendar \in {N("iso8601"), N("gregory")}) \/ kind = "PlainTime" ->
            [found |-> TRUE,
             kind |-> CASE kind = "PlainDate" -> "DateTimeFormat.PlainDate"
                        [] kind = "PlainDateTime" -> "DateTimeFormat.PlainDateTime"
                        [] kind = "PlainYearMonth" -> "DateTimeFormat.PlainYearMonth"
                        [] kind = "PlainMonthDay" -> "DateTimeFormat.PlainMonthDay"
                        [] OTHER -> "DateTimeFormat.PlainTime",
             calendar |-> IF hasDate /\ calendar = N("gregory") THEN "gregory" ELSE "iso8601",
             date |-> IF hasDate THEN [year |-> key[2], month |-> key[3], day |-> key[4]] ELSE [year |-> 1970, month |-> 1, day |-> 1],
             time |-> time]
       [] OTHER -> [found |-> FALSE]
DateTimeFormatPatternText(config, key) ==
  LET read(name) == DateTimeFormatRead(config, name)
      target == DateTimeFormatTarget(key)
      names == {"hourCycle", "weekday", "era", "year", "month", "day", "hour", "minute", "second",
                "fractionalSecondDigits", "dateStyle", "timeStyle", "dayPeriod"}
      values == [n \in names |-> read(n)]
      format == HostDateFormat(DateFormatKey(target.kind, target.calendar, read("hour12"), values))
  IN IF config[1] \notin {<<>>, <<N("en")>>, <<N("en-US")>>} \/ read("calendar") # Empty \/ read("numberingSystem") # Empty \/
        ~(read("timeZone") \in {Empty, N("UTC")}) \/ read("timeZoneName") # Empty \/ read("formatMatcher") = N("basic") \/
        ~target.found \/ format.found \notin {"format", "error"} \/
        (target.kind # "DateTimeFormat.PlainTime" /\ (target.date.year < 1583 \/ target.date.year > 9999))
     THEN [found |-> "none"]
     ELSE IF format.found = "error" THEN format
     ELSE [found |-> "text", text |-> LocaleText(format, 1, target.date, target.time)]

\* The methods of an Intl.DateTimeFormat, dtf, whose format is a function bound to it.
DateTimeFormatMethods ==
  {"DateTimeFormat.resolvedOptions", "DateTimeFormat.format", "DateTimeFormat.formatToParts",
   "DateTimeFormat.formatRange", "DateTimeFormat.formatRangeToParts"}
DateTimeFormatMethod(s, m, dtf, args) ==
  LET config == DateTimeFormatConfig(s, dtf) IN
  CASE m = "DateTimeFormat.resolvedOptions" ->
         LET answer == IntlAnswer(s, "DateTimeFormat", config, "resolvedOptions", <<>>) IN
         IF IsAbrupt(answer) THEN answer ELSE IntlResult(answer.s, "resolvedOptions", Val(answer))
    [] m = "DateTimeFormat.format" ->
         IF "boundFormat" \in DOMAIN O(s, dtf).slots THEN Ok(s, O(s, dtf).slots.boundFormat) ELSE
         LET bound == CreateBuiltinFunction(s, <<"Intl", "DateTimeFormat.boundFormat">>, 1, <<>>, dtf) IN
         Ok(SetSlots(bound.s, dtf, [boundFormat |-> Val(bound)]), Val(bound))
    [] m \in {"DateTimeFormat.boundFormat", "DateTimeFormat.formatToParts"} ->
         LET x == DateTimeFormattableKey(s, Arg(args, 1)) IN IF IsAbrupt(x) THEN x
         \* FormatDateTime's RangeError for a time value that TimeClip makes NaN.
         ELSE IF Val(x)[1] = "number" /\ Val(x)[2] = N("NaN") THEN ThrowError(x.s, "RangeError") ELSE
         LET method == IF m = "DateTimeFormat.boundFormat" THEN "format" ELSE "formatToParts"
             answer == HostIntl(<<"DateTimeFormat", config, "formatToParts", <<Val(x)>>>>)
             pattern == IF method = "format" /\ answer.found \notin {"parts", "error"}
                        THEN DateTimeFormatPatternText(config, Val(x)) ELSE [found |-> "none"]
         IN IF pattern.found = "text" THEN Ok(x.s, Str(pattern.text))
            ELSE IF pattern.found = "error" THEN ThrowError(x.s, pattern.error) ELSE
            LET found == IntlAnswer(x.s, "DateTimeFormat", config, "formatToParts", <<Val(x)>>) IN
            IF IsAbrupt(found) THEN found ELSE IntlResult(found.s, method, Val(found))
    [] OTHER ->
         IF Arg(args, 1) = Undefined \/ Arg(args, 2) = Undefined THEN ThrowTypeError(s) ELSE
         LET x == DateTimeFormattableKey(s, Arg(args, 1)) IN IF IsAbrupt(x) THEN x ELSE
         LET y == DateTimeFormattableKey(x.s, Arg(args, 2)) IN IF IsAbrupt(y) THEN y
         \* Where both are time values, as a Temporal object and another value of another kind throw a
         \* TypeError first.
         ELSE IF Val(x)[1] = "number" /\ Val(y)[1] = "number" /\ N("NaN") \in {Val(x)[2], Val(y)[2]}
         THEN ThrowError(y.s, "RangeError") ELSE
         LET method == IF m = "DateTimeFormat.formatRange" THEN "formatRange" ELSE "formatRangeToParts"
             answer == IntlAnswer(y.s, "DateTimeFormat", config, "formatRangeToParts", <<Val(x), Val(y)>>)
         IN IF IsAbrupt(answer) THEN answer ELSE IntlResult(answer.s, method, Val(answer))

\* Intl.Segmenter.prototype.segment (§19.3.3), %Segments% (§19.5), and %SegmentIterator% (§19.6), of
\* the segments that HostIntl gives for a segmenter's key and a string: the index each starts at and,
\* for word segments, whether it's like a word.
SegmentsOf(s, segmenter, string) ==
  IntlAnswer(s, "Segmenter", IntlConstructedConfig(s, segmenter, "Segmenter"), "segment", <<string>>)
\* The position of the segment of segments that holds index n of string, from the ith on.
SegmentAt(segments, n, i) ==
  IF i < Len(segments.starts) /\ segments.starts[i + 1] <= n THEN SegmentAt(segments, n, i + 1) ELSE i
\* CreateSegmentDataObject (§19.7.1) of the ith segment of segments of string.
SegmentDataObject(s, segmenter, segments, string, i) ==
  LET start == segments.starts[i]
      end == IF i < Len(segments.starts) THEN segments.starts[i + 1] ELSE Len(string)
      o == OrdinaryObjectCreate(s, Intrinsic(s, "ObjectPrototype"))
      pairs == <<<<SV("segment"), Str(SubSeq(string, start + 1, end))>>, <<SV("index"), IntV(start)>>, <<SV("input"), Str(string)>>>>
  IN Ok(SetO(o.s, Val(o), WithDataProps(O(o.s, Val(o)),
                                        IF segments.words = <<>> THEN pairs ELSE Append(pairs, <<SV("isWordLike"), Bool(segments.words[i])>>))),
        Val(o))
SegmenterMethod(s, m, this, args) ==
  CASE m = "Segmenter.segment" ->
         LET string == ToStr(s, Arg(args, 1)) IN IF IsAbrupt(string) THEN string ELSE
         LET a == Alloc(string.s, MakeObject(Intrinsic(string.s, "IntlSegmentsPrototype"), "intlSegments",
                                             [segmenter |-> this, string |-> Val(string).value]))
         IN Ok(a.s, a.v)
    [] m = "Segments.containing" ->
         LET slots == O(s, this).slots
             n == ToIntegerOrInfinity(s, Arg(args, 1))
         IN IF IsAbrupt(n) THEN n
            ELSE IF NumLess(Val(n).value, NumFromInt(0)) \/ ~NumLess(Val(n).value, NumFromInt(Len(slots.string))) THEN Ok(n.s, Undefined) ELSE
            LET segments == SegmentsOf(n.s, slots.segmenter, slots.string) IN IF IsAbrupt(segments) THEN segments
            ELSE SegmentDataObject(segments.s, slots.segmenter, Val(segments), slots.string,
                                   SegmentAt(Val(segments), NumToInt(Val(n).value), 1))
    [] m = "Segments.iterator" ->
         LET slots == O(s, this).slots
             a == Alloc(s, MakeObject(Intrinsic(s, "IntlSegmentIteratorPrototype"), "intlSegmentIterator",
                                      [segmenter |-> slots.segmenter, string |-> slots.string, position |-> 0]))
         IN Ok(a.s, a.v)
    [] OTHER ->
         LET slots == O(s, this).slots IN
         IF slots.position >= Len(slots.string) THEN CreateIterResultObject(s, Undefined, TRUE) ELSE
         LET segments == SegmentsOf(s, slots.segmenter, slots.string) IN IF IsAbrupt(segments) THEN segments ELSE
         LET i == SegmentAt(Val(segments), slots.position, 1)
             end == IF i < Len(Val(segments).starts) THEN Val(segments).starts[i + 1] ELSE Len(slots.string)
             data == SegmentDataObject(SetSlots(segments.s, this, [position |-> end]), slots.segmenter, Val(segments), slots.string, i)
         IN IF IsAbrupt(data) THEN data ELSE CreateIterResultObject(data.s, Val(data), FALSE)
\* The class of the object that each method of a segmenter, its segments, and their iterator takes.
SegmenterClasses ==
  ("Segmenter.segment" :> "intlSegmenter") @@ ("Segments.containing" :> "intlSegments") @@
  ("Segments.iterator" :> "intlSegments") @@ ("SegmentIterator.next" :> "intlSegmentIterator")

\* The units of Intl.DurationFormat (Table 20), each with its option, its display option, the styles
\* it takes, and its digital default.
DurationUnit(unit, key, display, styles, digital) == [unit |-> unit, key |-> key, display |-> display, styles |-> styles, digital |-> digital]
DurationDateStyles == {N("long"), N("short"), N("narrow")}
DurationUnits ==
  <<DurationUnit("years", SV("years"), SV("yearsDisplay"), DurationDateStyles, N("short")),
    DurationUnit("months", SV("months"), SV("monthsDisplay"), DurationDateStyles, N("short")),
    DurationUnit("weeks", SV("weeks"), SV("weeksDisplay"), DurationDateStyles, N("short")),
    DurationUnit("days", SV("days"), SV("daysDisplay"), DurationDateStyles, N("short")),
    DurationUnit("hours", SV("hours"), SV("hoursDisplay"), DurationDateStyles \cup {N("numeric"), N("2-digit")}, N("numeric")),
    DurationUnit("minutes", SV("minutes"), SV("minutesDisplay"), DurationDateStyles \cup {N("numeric"), N("2-digit")}, N("numeric")),
    DurationUnit("seconds", SV("seconds"), SV("secondsDisplay"), DurationDateStyles \cup {N("numeric"), N("2-digit")}, N("numeric")),
    DurationUnit("milliseconds", SV("milliseconds"), SV("millisecondsDisplay"), DurationDateStyles \cup {N("numeric")}, N("numeric")),
    DurationUnit("microseconds", SV("microseconds"), SV("microsecondsDisplay"), DurationDateStyles \cup {N("numeric")}, N("numeric")),
    DurationUnit("nanoseconds", SV("nanoseconds"), SV("nanosecondsDisplay"), DurationDateStyles \cup {N("numeric")}, N("numeric"))>>

\* GetDurationUnitOptions (§13.5.6) of each unit from the ith on, with the previous unit's style,
\* appending to acc the style and the display that the options give, or Empty. It leaves out the
\* two-digit hours of a locale's digital format, which only HostIntl knows.
DurationUnitOptionsFrom(s, options, base, i, prev, acc) ==
  IF i > Len(DurationUnits) THEN Ok(s, acc) ELSE
  LET u == DurationUnits[i]
      given == GetStringOption(s, options, u.key, u.styles, Empty)
  IN IF IsAbrupt(given) THEN given ELSE
  LET g == Val(given)
      isTime == u.unit \in {"hours", "minutes", "seconds"}
      isMinuteOrSecond == u.unit \in {"minutes", "seconds"}
      first == CASE g # Empty -> [style |-> g, display |-> N("always")]
                 [] base = N("digital") -> [style |-> u.digital, display |-> IF isTime THEN N("always") ELSE N("auto")]
                 [] prev \in {N("fractional"), N("numeric"), N("2-digit")} ->
                      [style |-> N("numeric"), display |-> IF isMinuteOrSecond THEN N("always") ELSE N("auto")]
                 [] OTHER -> [style |-> base, display |-> N("auto")]
      chosen == IF first.style = N("numeric") /\ u.unit \in {"milliseconds", "microseconds", "nanoseconds"}
                THEN [style |-> N("fractional"), display |-> N("auto")] ELSE first
      read == GetStringOption(given.s, options, u.display, {N("auto"), N("always")}, Empty)
  IN IF IsAbrupt(read) THEN read ELSE
  LET display == IF Val(read) = Empty THEN chosen.display ELSE Val(read)
      style == IF isMinuteOrSecond /\ prev \in {N("numeric"), N("2-digit")} THEN N("2-digit") ELSE chosen.style
  IN CASE display = N("always") /\ chosen.style = N("fractional") -> ThrowError(read.s, "RangeError")
       [] prev = N("fractional") /\ chosen.style # N("fractional") -> ThrowError(read.s, "RangeError")
       [] prev \in {N("numeric"), N("2-digit")} /\ chosen.style \notin {N("fractional"), N("numeric"), N("2-digit")} ->
            ThrowError(read.s, "RangeError")
       [] OTHER ->
            DurationUnitOptionsFrom(read.s, options, base, i + 1,
                                    IF u.unit \in {"hours", "minutes", "seconds", "milliseconds", "microseconds"} THEN style ELSE prev,
                                    acc \o <<g, Val(read)>>)

\* The constructor of Intl.DurationFormat (§13.1.1), whose object holds its requested locales and the
\* options it read, and which constructs where HostIntl's answer for them does.
DurationFormatConstruct(s, newTarget, locales, options) ==
  LET o == OrdinaryCreateFromConstructor(s, newTarget, "IntlDurationFormatPrototype", "intlDurationFormat",
                                         [locales |-> <<>>, options |-> Empty]) IN IF IsAbrupt(o) THEN o ELSE
  LET requested == CanonicalizeLocaleList(o.s, locales) IN IF IsAbrupt(requested) THEN requested ELSE
  LET opts == CASE options = Undefined -> OrdinaryObjectCreate(requested.s, Null)
                [] IsObject(options) -> Ok(requested.s, options)
                [] OTHER -> ThrowTypeError(requested.s)
  IN IF IsAbrupt(opts) THEN opts ELSE
  LET matcher == GetStringOption(opts.s, Val(opts), SV("localeMatcher"), {N("lookup"), N("best fit")}, N("best fit")) IN
  IF IsAbrupt(matcher) THEN matcher ELSE
  LET nu == GetAnyStringOption(matcher.s, Val(opts), SV("numberingSystem")) IN IF IsAbrupt(nu) THEN nu
  ELSE IF Val(nu) # Empty /\ ~IsTypeSequenceFrom(Val(nu), 1, 0) THEN ThrowError(nu.s, "RangeError") ELSE
  LET style == GetStringOption(nu.s, Val(opts), SV("style"), {N("long"), N("short"), N("narrow"), N("digital")}, N("short")) IN
  IF IsAbrupt(style) THEN style ELSE
  LET units == DurationUnitOptionsFrom(style.s, Val(opts), Val(style), 1, <<>>, <<>>) IN IF IsAbrupt(units) THEN units ELSE
  LET digits == GetNumberOption(units.s, Val(opts), SV("fractionalDigits"), 0, 9, Empty) IN IF IsAbrupt(digits) THEN digits ELSE
  LET config == <<Val(requested), Val(matcher), Val(nu), Val(style), Val(units), Val(digits)>>
      answer == IntlAnswer(digits.s, "DurationFormat", config, "construct", <<>>)
  IN IF IsAbrupt(answer) THEN answer ELSE Ok(SetSlots(answer.s, Val(o), [locales |-> Val(requested), options |-> config]), Val(o))

\* The methods of an Intl.DurationFormat, df: ToDurationRecord, as Temporal reads a duration, whose
\* fields' units key HostIntl's entries.
DurationFormatMethods ==
  {"DurationFormat.resolvedOptions", "DurationFormat.format", "DurationFormat.formatToParts"}
DurationFormatMethod(s, m, df, args) ==
  LET config == O(s, df).slots.options IN
  IF m = "DurationFormat.resolvedOptions" THEN
    LET answer == IntlAnswer(s, "DurationFormat", config, "resolvedOptions", <<>>) IN
    IF IsAbrupt(answer) THEN answer ELSE IntlResult(answer.s, "resolvedOptions", Val(answer))
  ELSE IF ~IsObject(Arg(args, 1)) /\ ~IsString(Arg(args, 1)) THEN ThrowTypeError(s) ELSE
  LET f == ToTemporalDurationFields(s, Arg(args, 1)) IN IF IsAbrupt(f) THEN f ELSE
  LET method == IF m = "DurationFormat.format" THEN "format" ELSE "formatToParts"
      answer == IntlAnswer(f.s, "DurationFormat", config, "formatToParts", <<<<"duration", [i \in 1..10 |-> TIUnits(Val(f)[i])]>>>>)
  IN IF IsAbrupt(answer) THEN answer ELSE IntlResult(answer.s, method, Val(answer))

\* String.prototype.localeCompare (ECMA-402 §19.1.1): the compare of a new Intl.Collator.
IntlLocaleCompare(s, x, y, locales, options) ==
  LET c == IntlConstruct(s, "Collator", Intrinsic(s, "IntlCollator"), locales, options) IN IF IsAbrupt(c) THEN c ELSE
  LET answer == IntlAnswer(c.s, "Collator", IntlConstructedConfig(c.s, Val(c), "Collator"), "compare", <<x, y>>) IN
  IF IsAbrupt(answer) THEN answer ELSE IntlResult(answer.s, "compare", Val(answer))

\* TransformCase (ECMA-402 §19.1.2) of a string's units in the locales given: as JS.tla's case
\* mapping in the host's default locale, where it isn't one that tailors case, and else what
\* HostIntl answers.
IntlTransformCase(s, m, units, locales, isTailored) ==
  LET requested == CanonicalizeLocaleList(s, locales) IN IF IsAbrupt(requested) THEN requested
  ELSE IF Val(requested) = <<>> THEN
    IF isTailored THEN Unsupported(requested.s, N("Unsupported: a locale whose case mappings the host tailors"))
    ELSE Ok(requested.s, Str(IF m = "toLocaleLowerCase" THEN ToLowercase(units) ELSE ToUppercase(units)))
  ELSE LET answer == IntlAnswer(requested.s, "String", <<Val(requested)>>, m, <<units>>) IN
       IF IsAbrupt(answer) THEN answer ELSE IntlResult(answer.s, m, Val(answer))

\* %Intl%.[[FallbackSymbol]], which the realm makes the first time Intl reads it.
IntlFallbackSymbol(s) ==
  LET intl == Intrinsic(s, "Intl") IN
  IF "fallback" \in DOMAIN O(s, intl).slots THEN [s |-> s, v |-> O(s, intl).slots.fallback]
  ELSE LET made == NewSymbol(s, Str(N("IntlLegacyConstructedSymbol"))) IN
       [s |-> SetSlots(made.s, intl, [fallback |-> made.v]), v |-> made.v]

\* Date.prototype.toLocaleString, toLocaleDateString, and toLocaleTimeString (ECMA-402 §20.4) of a
\* time value that isn't NaN: CreateDateTimeFormat of the locales and the options, which reads them
\* as Intl.DateTimeFormat does, and the format that HostIntl answers for it.
DateToLocaleString(s, m, t, locales, options) ==
  LET d == IntlConstruct(s, "DateTimeFormat", Intrinsic(s, "IntlDateTimeFormat"), locales, options) IN IF IsAbrupt(d) THEN d ELSE
  LET answer == IntlAnswer(d.s, "Date", DateTimeFormatConfig(d.s, Val(d)), m, <<IntlNumberKey(IntlTimeClip(t))>>) IN
  IF IsAbrupt(answer) THEN answer ELSE IntlResult(answer.s, m, Val(answer))

IntlIntrinsics ==
  <<
     IntrinsicObject("Intl", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("IntlDateTimeFormat", "FunctionPrototype", <<"Intl", "DateTimeFormat">>, 0, N("DateTimeFormat"), TRUE),
     IntrinsicObject("IntlDateTimeFormatPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("IntlNumberFormat", "FunctionPrototype", <<"Intl", "NumberFormat">>, 0, N("NumberFormat"), TRUE),
     IntrinsicObject("IntlNumberFormatPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("IntlCollator", "FunctionPrototype", <<"Intl", "Collator">>, 0, N("Collator"), TRUE),
     IntrinsicObject("IntlCollatorPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("IntlPluralRules", "FunctionPrototype", <<"Intl", "PluralRules">>, 0, N("PluralRules"), TRUE),
     IntrinsicObject("IntlPluralRulesPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("IntlRelativeTimeFormat", "FunctionPrototype", <<"Intl", "RelativeTimeFormat">>, 0, N("RelativeTimeFormat"), TRUE),
     IntrinsicObject("IntlRelativeTimeFormatPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("IntlListFormat", "FunctionPrototype", <<"Intl", "ListFormat">>, 0, N("ListFormat"), TRUE),
     IntrinsicObject("IntlListFormatPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("IntlLocale", "FunctionPrototype", <<"Intl", "Locale">>, 1, N("Locale"), TRUE),
     IntrinsicObject("IntlLocalePrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("IntlDisplayNames", "FunctionPrototype", <<"Intl", "DisplayNames">>, 2, N("DisplayNames"), TRUE),
     IntrinsicObject("IntlDisplayNamesPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("IntlSegmenter", "FunctionPrototype", <<"Intl", "Segmenter">>, 0, N("Segmenter"), TRUE),
     IntrinsicObject("IntlSegmenterPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicObject("IntlSegmentsPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicObject("IntlSegmentIteratorPrototype", "IteratorPrototype", "ordinary", [none |-> TRUE]),
     IntrinsicFunction("IntlDurationFormat", "FunctionPrototype", <<"Intl", "DurationFormat">>, 0, N("DurationFormat"), TRUE),
     IntrinsicObject("IntlDurationFormatPrototype", "ObjectPrototype", "ordinary", [none |-> TRUE]) >>

IntlProperties ==
  << M("Intl", SV("getCanonicalLocales"), "Intl", "getCanonicalLocales", 1),
     M("Intl", SV("supportedValuesOf"), "Intl", "supportedValuesOf", 1),
     L("Intl", SV("DateTimeFormat"), "IntlDateTimeFormat", TRUE, FALSE, TRUE),
     L("Intl", SV("NumberFormat"), "IntlNumberFormat", TRUE, FALSE, TRUE),
     L("Intl", SV("Collator"), "IntlCollator", TRUE, FALSE, TRUE),
     L("Intl", SV("PluralRules"), "IntlPluralRules", TRUE, FALSE, TRUE),
     L("Intl", SV("RelativeTimeFormat"), "IntlRelativeTimeFormat", TRUE, FALSE, TRUE),
     L("Intl", SV("ListFormat"), "IntlListFormat", TRUE, FALSE, TRUE),
     L("Intl", SV("Locale"), "IntlLocale", TRUE, FALSE, TRUE),
     L("Intl", SV("DisplayNames"), "IntlDisplayNames", TRUE, FALSE, TRUE),
     L("Intl", SV("Segmenter"), "IntlSegmenter", TRUE, FALSE, TRUE),
     L("Intl", SV("DurationFormat"), "IntlDurationFormat", TRUE, FALSE, TRUE),
     V("Intl", SymToStringTag, SV("Intl"), FALSE, FALSE, TRUE),
     GlobalLink("Intl", N("Intl")) >>
  \o Ctor("IntlDateTimeFormat", "IntlDateTimeFormatPrototype") \o
  << M("IntlDateTimeFormat", SV("supportedLocalesOf"), "Intl", "DateTimeFormat.supportedLocalesOf", 1),
     M("IntlDateTimeFormatPrototype", SV("resolvedOptions"), "Intl", "DateTimeFormat.resolvedOptions", 0),
     M("IntlDateTimeFormatPrototype", SV("formatToParts"), "Intl", "DateTimeFormat.formatToParts", 1),
     G("IntlDateTimeFormatPrototype", SV("format"), "Intl", "DateTimeFormat.format", ""),
     M("IntlDateTimeFormatPrototype", SV("formatRange"), "Intl", "DateTimeFormat.formatRange", 2),
     M("IntlDateTimeFormatPrototype", SV("formatRangeToParts"), "Intl", "DateTimeFormat.formatRangeToParts", 2),
     V("IntlDateTimeFormatPrototype", SymToStringTag, SV("Intl.DateTimeFormat"), FALSE, FALSE, TRUE) >>
  \o Ctor("IntlNumberFormat", "IntlNumberFormatPrototype") \o
  << M("IntlNumberFormat", SV("supportedLocalesOf"), "Intl", "NumberFormat.supportedLocalesOf", 1),
     M("IntlNumberFormatPrototype", SV("resolvedOptions"), "Intl", "NumberFormat.resolvedOptions", 0),
     M("IntlNumberFormatPrototype", SV("formatToParts"), "Intl", "NumberFormat.formatToParts", 1),
     G("IntlNumberFormatPrototype", SV("format"), "Intl", "NumberFormat.format", ""),
     M("IntlNumberFormatPrototype", SV("formatRange"), "Intl", "NumberFormat.formatRange", 2),
     M("IntlNumberFormatPrototype", SV("formatRangeToParts"), "Intl", "NumberFormat.formatRangeToParts", 2),
     V("IntlNumberFormatPrototype", SymToStringTag, SV("Intl.NumberFormat"), FALSE, FALSE, TRUE) >>
  \o Ctor("IntlCollator", "IntlCollatorPrototype") \o
  << M("IntlCollator", SV("supportedLocalesOf"), "Intl", "Collator.supportedLocalesOf", 1),
     M("IntlCollatorPrototype", SV("resolvedOptions"), "Intl", "Collator.resolvedOptions", 0),
     G("IntlCollatorPrototype", SV("compare"), "Intl", "Collator.compare", ""),
     V("IntlCollatorPrototype", SymToStringTag, SV("Intl.Collator"), FALSE, FALSE, TRUE) >>
  \o Ctor("IntlPluralRules", "IntlPluralRulesPrototype") \o
  << M("IntlPluralRules", SV("supportedLocalesOf"), "Intl", "PluralRules.supportedLocalesOf", 1),
     M("IntlPluralRulesPrototype", SV("resolvedOptions"), "Intl", "PluralRules.resolvedOptions", 0),
     M("IntlPluralRulesPrototype", SV("select"), "Intl", "PluralRules.select", 1),
     M("IntlPluralRulesPrototype", SV("selectRange"), "Intl", "PluralRules.selectRange", 2),
     V("IntlPluralRulesPrototype", SymToStringTag, SV("Intl.PluralRules"), FALSE, FALSE, TRUE) >>
  \o Ctor("IntlRelativeTimeFormat", "IntlRelativeTimeFormatPrototype") \o
  << M("IntlRelativeTimeFormat", SV("supportedLocalesOf"), "Intl", "RelativeTimeFormat.supportedLocalesOf", 1),
     M("IntlRelativeTimeFormatPrototype", SV("resolvedOptions"), "Intl", "RelativeTimeFormat.resolvedOptions", 0),
     M("IntlRelativeTimeFormatPrototype", SV("format"), "Intl", "RelativeTimeFormat.format", 2),
     M("IntlRelativeTimeFormatPrototype", SV("formatToParts"), "Intl", "RelativeTimeFormat.formatToParts", 2),
     V("IntlRelativeTimeFormatPrototype", SymToStringTag, SV("Intl.RelativeTimeFormat"), FALSE, FALSE, TRUE) >>
  \o Ctor("IntlListFormat", "IntlListFormatPrototype") \o
  << M("IntlListFormat", SV("supportedLocalesOf"), "Intl", "ListFormat.supportedLocalesOf", 1),
     M("IntlListFormatPrototype", SV("resolvedOptions"), "Intl", "ListFormat.resolvedOptions", 0),
     M("IntlListFormatPrototype", SV("format"), "Intl", "ListFormat.format", 1),
     M("IntlListFormatPrototype", SV("formatToParts"), "Intl", "ListFormat.formatToParts", 1),
     V("IntlListFormatPrototype", SymToStringTag, SV("Intl.ListFormat"), FALSE, FALSE, TRUE) >>
  \o Ctor("IntlLocale", "IntlLocalePrototype") \o
  << M("IntlLocalePrototype", SV("toString"), "Intl", "Locale.toString", 0),
     M("IntlLocalePrototype", SV("maximize"), "Intl", "Locale.maximize", 0),
     M("IntlLocalePrototype", SV("minimize"), "Intl", "Locale.minimize", 0),
     G("IntlLocalePrototype", SV("language"), "Intl", "Locale.language", ""),
     G("IntlLocalePrototype", SV("script"), "Intl", "Locale.script", ""),
     G("IntlLocalePrototype", SV("region"), "Intl", "Locale.region", ""),
     G("IntlLocalePrototype", SV("baseName"), "Intl", "Locale.baseName", ""),
     G("IntlLocalePrototype", SV("calendar"), "Intl", "Locale.calendar", ""),
     G("IntlLocalePrototype", SV("caseFirst"), "Intl", "Locale.caseFirst", ""),
     G("IntlLocalePrototype", SV("collation"), "Intl", "Locale.collation", ""),
     G("IntlLocalePrototype", SV("firstDayOfWeek"), "Intl", "Locale.firstDayOfWeek", ""),
     G("IntlLocalePrototype", SV("hourCycle"), "Intl", "Locale.hourCycle", ""),
     G("IntlLocalePrototype", SV("numeric"), "Intl", "Locale.numeric", ""),
     G("IntlLocalePrototype", SV("numberingSystem"), "Intl", "Locale.numberingSystem", ""),
     M("IntlLocalePrototype", SV("getCalendars"), "Intl", "Locale.getCalendars", 0),
     M("IntlLocalePrototype", SV("getCollations"), "Intl", "Locale.getCollations", 0),
     M("IntlLocalePrototype", SV("getHourCycles"), "Intl", "Locale.getHourCycles", 0),
     M("IntlLocalePrototype", SV("getNumberingSystems"), "Intl", "Locale.getNumberingSystems", 0),
     M("IntlLocalePrototype", SV("getTimeZones"), "Intl", "Locale.getTimeZones", 0),
     M("IntlLocalePrototype", SV("getTextInfo"), "Intl", "Locale.getTextInfo", 0),
     M("IntlLocalePrototype", SV("getWeekInfo"), "Intl", "Locale.getWeekInfo", 0),
     V("IntlLocalePrototype", SymToStringTag, SV("Intl.Locale"), FALSE, FALSE, TRUE) >>
  \o Ctor("IntlDisplayNames", "IntlDisplayNamesPrototype") \o
  << M("IntlDisplayNames", SV("supportedLocalesOf"), "Intl", "DisplayNames.supportedLocalesOf", 1),
     M("IntlDisplayNamesPrototype", SV("resolvedOptions"), "Intl", "DisplayNames.resolvedOptions", 0),
     M("IntlDisplayNamesPrototype", SV("of"), "Intl", "DisplayNames.of", 1),
     V("IntlDisplayNamesPrototype", SymToStringTag, SV("Intl.DisplayNames"), FALSE, FALSE, TRUE) >>
  \o Ctor("IntlSegmenter", "IntlSegmenterPrototype") \o
  << M("IntlSegmenter", SV("supportedLocalesOf"), "Intl", "Segmenter.supportedLocalesOf", 1),
     M("IntlSegmenterPrototype", SV("resolvedOptions"), "Intl", "Segmenter.resolvedOptions", 0),
     M("IntlSegmenterPrototype", SV("segment"), "Intl", "Segmenter.segment", 1),
     M("IntlSegmentsPrototype", SV("containing"), "Intl", "Segments.containing", 1),
     M("IntlSegmentsPrototype", SymIterator, "Intl", "Segments.iterator", 0),
     M("IntlSegmentIteratorPrototype", SV("next"), "Intl", "SegmentIterator.next", 0),
     V("IntlSegmentIteratorPrototype", SymToStringTag, SV("Segmenter String Iterator"), FALSE, FALSE, TRUE),
     V("IntlSegmenterPrototype", SymToStringTag, SV("Intl.Segmenter"), FALSE, FALSE, TRUE) >>
  \o Ctor("IntlDurationFormat", "IntlDurationFormatPrototype") \o
  << M("IntlDurationFormat", SV("supportedLocalesOf"), "Intl", "DurationFormat.supportedLocalesOf", 1),
     M("IntlDurationFormatPrototype", SV("resolvedOptions"), "Intl", "DurationFormat.resolvedOptions", 0),
     M("IntlDurationFormatPrototype", SV("format"), "Intl", "DurationFormat.format", 1),
     M("IntlDurationFormatPrototype", SV("formatToParts"), "Intl", "DurationFormat.formatToParts", 1),
     V("IntlDurationFormatPrototype", SymToStringTag, SV("Intl.DurationFormat"), FALSE, FALSE, TRUE) >>

\* Intl's functions. Where a method unwraps its receiver first, an object that inherits from the
\* constructor's prototype, through which it would read %Intl%.[[FallbackSymbol]], stops.
IntlBuiltin(s, f, m, this, args, nt) ==
  CASE m \in IntlConstructors ->
         IF nt = Undefined /\ m \notin IntlCallableConstructors THEN ThrowTypeError(s)
         ELSE IF m = "Locale" THEN LocaleConstruct(s, nt, Arg(args, 1), Arg(args, 2))
         ELSE IF m = "DurationFormat" THEN DurationFormatConstruct(s, nt, Arg(args, 1), Arg(args, 2))
         ELSE IF m \in DOMAIN IntlConstructorOptions \cup {"NumberFormat", "PluralRules"} THEN
           LET o == IF m = "NumberFormat" THEN NumberFormatConstruct(s, IF nt = Undefined THEN f ELSE nt, Arg(args, 1), Arg(args, 2))
                    ELSE IF m = "PluralRules" THEN PluralRulesConstruct(s, nt, Arg(args, 1), Arg(args, 2))
                    ELSE IntlConstruct(s, m, IF nt = Undefined THEN f ELSE nt, Arg(args, 1), Arg(args, 2)) IN
           IF IsAbrupt(o) \/ nt # Undefined \/ m \notin {"DateTimeFormat", "NumberFormat"} THEN o ELSE
           \* ChainDateTimeFormat and ChainNumberFormat, which define %Intl%.[[FallbackSymbol]] on an
           \* instance that a call without new receives.
           LET inherits == OrdinaryHasInstance(o.s, f, this) IN IF IsAbrupt(inherits) THEN inherits
           ELSE IF Val(inherits) = True THEN
             LET symbol == IntlFallbackSymbol(inherits.s)
                 defined == DefinePropertyOrThrow(symbol.s, this, symbol.v, DataDesc(Val(o), FALSE, FALSE, FALSE))
             IN IF IsAbrupt(defined) THEN defined ELSE Ok(defined.s, this)
           ELSE Ok(inherits.s, Val(o))
         ELSE Unsupported(s, N("Unsupported: an Intl constructor, which reads locale data"))
    [] m = "getCanonicalLocales" ->
         LET list == CanonicalizeLocaleList(s, Arg(args, 1)) IN IF IsAbrupt(list) THEN list
         ELSE CreateArrayFromList(list.s, [i \in DOMAIN Val(list) |-> Str(Val(list)[i])])
    [] m = "supportedValuesOf" ->
         LET key == ToStr(s, Arg(args, 1)) IN IF IsAbrupt(key) THEN key
         ELSE IF Val(key).value \notin {N("calendar"), N("collation"), N("currency"), N("numberingSystem"), N("timeZone"), N("unit")}
         THEN ThrowError(key.s, "RangeError")
         ELSE LET answer == IntlAnswer(key.s, "Intl", <<>>, "supportedValuesOf", <<Val(key).value>>) IN
              IF IsAbrupt(answer) THEN answer ELSE IntlResult(answer.s, "supportedValuesOf", Val(answer))
    [] m \in IntlSupportedLocalesOf ->
         LET list == CanonicalizeLocaleList(s, Arg(args, 1)) IN IF IsAbrupt(list) THEN list
         ELSE FilterLocales(list.s, IntlServiceOf(m), Val(list), Arg(args, 2))
    [] m = "NumberFormat.boundFormat" -> NumberFormatMethod(s, f, m, O(s, f).slots.data, args)
    [] m = "Collator.boundCompare" -> IntlHostMethod(s, m, O(s, f).slots.data, args)
    [] m \in DOMAIN SegmenterClasses ->
         IF IsObject(this) /\ O(s, this).class = SegmenterClasses[m] THEN SegmenterMethod(s, m, this, args) ELSE ThrowTypeError(s)
    [] m = "DateTimeFormat.boundFormat" -> DateTimeFormatMethod(s, m, O(s, f).slots.data, args)
    [] m \in DurationFormatMethods /\ IsObject(this) /\ O(s, this).class = "intlDurationFormat" -> DurationFormatMethod(s, m, this, args)
    [] m \in DateTimeFormatMethods /\ IsObject(this) /\ O(s, this).class = "intlDateTimeFormat" -> DateTimeFormatMethod(s, m, this, args)
    [] m \in LocaleMethods /\ IsObject(this) /\ O(s, this).class = "intlLocale" -> LocaleMethod(s, m, this)
    [] m \in IntlHostMethods /\ IsObject(this) /\ O(s, this).class = "intl" \o IntlMethodServices[m] -> IntlHostMethod(s, m, this, args)
    [] m \in NumberFormatMethods /\ IsObject(this) /\ O(s, this).class = "intlNumberFormat" -> NumberFormatMethod(s, f, m, this, args)
    [] m \in DOMAIN IntlUnwrappingMethods ->
         IF ~IsObject(this) THEN ThrowTypeError(s) ELSE
         LET inherits == OrdinaryHasInstance(s, Intrinsic(s, IntlUnwrappingMethods[m]), this) IN IF IsAbrupt(inherits) THEN inherits
         ELSE IF Val(inherits) = False THEN ThrowTypeError(inherits.s) ELSE
         \* UnwrapNumberFormat and UnwrapDateTimeFormat, through %Intl%.[[FallbackSymbol]].
         LET symbol == IntlFallbackSymbol(inherits.s)
             unwrapped == Get(symbol.s, this, symbol.v)
             class == IF IntlUnwrappingMethods[m] = "IntlNumberFormat" THEN "intlNumberFormat" ELSE "intlDateTimeFormat"
         IN IF IsAbrupt(unwrapped) THEN unwrapped
            ELSE IF ~IsObject(Val(unwrapped)) \/ O(unwrapped.s, Val(unwrapped)).class # class THEN ThrowTypeError(unwrapped.s)
            ELSE IF class = "intlNumberFormat" THEN NumberFormatMethod(unwrapped.s, f, m, Val(unwrapped), args)
            ELSE DateTimeFormatMethod(unwrapped.s, m, Val(unwrapped), args)
    [] IsObject(this) /\ O(s, this).class = "intl" \o IntlMethodServices[m] ->
         Unsupported(s, N("Unsupported: an Intl object's method, which reads locale data"))
    [] OTHER -> ThrowTypeError(s)
