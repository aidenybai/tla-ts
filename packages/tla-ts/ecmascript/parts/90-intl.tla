\* ECMA-402's Intl, which engine262 lacks, without its locale data: the namespace, its constructors
\* and their prototypes, as the spec lays them out, and what each of their functions does before it
\* reads locale data, or with what HostLocale gives of it. The constructors of IntlConstructorOptions
\* read their options and make an object that holds them; the others stop. A method of an Intl
\* object stops, and on another value throws the TypeError of RequireInternalSlot.

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
\* its kind: "string" with the values it may take, "boolean", or "type", a string that must be a
\* type sequence of UTS 35, and whether the constructor throws a TypeError where it's undefined.
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
     ELSE LET str == ToStr(value.s, Val(value)) IN IF IsAbrupt(str) THEN str
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
  ELSE Ok(SetSlots(read.s, Val(o), [locales |-> Val(requested), options |-> Val(read)]), Val(o))

\* CanonicalizeLocaleList (ECMA-402 §9.2.1), as a list of canonical tags, which reads whether a tag
\* is valid and its canonical form from HostLocale. A list longer than any a program makes stops,
\* which would take that many steps to walk.
CanonicalizeLocaleList(s, locales) ==
  IF locales = Undefined THEN Ok(s, <<>>)
  ELSE IF IsString(locales) THEN CanonicalizeLocale(s, locales.value, <<>>) ELSE
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
     ELSE IF ~IsString(Val(value)) /\ ~IsObject(Val(value)) THEN ThrowTypeError(value.s) ELSE
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
         ELSE IF m \in DOMAIN IntlConstructorOptions THEN IntlConstruct(s, m, IF nt = Undefined THEN f ELSE nt, Arg(args, 1), Arg(args, 2))
         ELSE Unsupported(s, N("Unsupported: an Intl constructor, which reads locale data"))
    [] m = "getCanonicalLocales" ->
         LET list == CanonicalizeLocaleList(s, Arg(args, 1)) IN IF IsAbrupt(list) THEN list
         ELSE CreateArrayFromList(list.s, [i \in DOMAIN Val(list) |-> Str(Val(list)[i])])
    [] m = "supportedValuesOf" ->
         LET key == ToStr(s, Arg(args, 1)) IN IF IsAbrupt(key) THEN key
         ELSE IF Val(key).value \notin {N("calendar"), N("collation"), N("currency"), N("numberingSystem"), N("timeZone"), N("unit")}
         THEN ThrowError(key.s, "RangeError")
         ELSE Unsupported(key.s, N("Unsupported: the values that the host supports"))
    [] m \in IntlSupportedLocalesOf ->
         LET list == CanonicalizeLocaleList(s, Arg(args, 1)) IN IF IsAbrupt(list) THEN list
         ELSE FilterLocales(list.s, IntlServiceOf(m), Val(list), Arg(args, 2))
    [] m \in DOMAIN IntlUnwrappingMethods ->
         IF ~IsObject(this) THEN ThrowTypeError(s) ELSE
         LET inherits == OrdinaryHasInstance(s, Intrinsic(s, IntlUnwrappingMethods[m]), this) IN IF IsAbrupt(inherits) THEN inherits
         ELSE IF Val(inherits) = True THEN Unsupported(inherits.s, N("Unsupported: an object that Intl unwraps"))
         ELSE ThrowTypeError(inherits.s)
    [] IsObject(this) /\ O(s, this).class = "intl" \o IntlMethodServices[m] ->
         Unsupported(s, N("Unsupported: an Intl object's method, which reads locale data"))
    [] OTHER -> ThrowTypeError(s)
