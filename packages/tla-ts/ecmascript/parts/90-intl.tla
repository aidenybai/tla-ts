\* ECMA-402's Intl, which engine262 lacks, without its locale data: the namespace, its constructors
\* and their prototypes, as the spec lays them out, and what each of their functions does before it
\* reads locale data. A constructor stops before it makes an object, so no Intl object exists, and
\* each prototype method throws the TypeError of RequireInternalSlot. CanonicalizeLocaleList walks
\* its list and stops at the first locale, whose canonical form is locale data.

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

\* CanonicalizeLocaleList (ECMA-402 §9.2.1) up to the first locale of the list. A list longer than
\* any a program makes stops, which would take that many steps to walk.
CanonicalizeLocaleList(s, locales) ==
  IF locales = Undefined THEN Ok(s, <<>>)
  ELSE IF IsString(locales) THEN Unsupported(s, N("Unsupported: a locale, whose canonical form is locale data")) ELSE
  LET o == ToObject(s, locales) IN IF IsAbrupt(o) THEN o ELSE
  LET len == LengthOfArrayLike(o.s, Val(o)) IN IF IsAbrupt(len) THEN len
  ELSE IF NumLess(NumFromInt(10000000), Val(len).value) THEN Unsupported(len.s, N("Unsupported: a long list of locales"))
  ELSE CanonicalizeLocalesFrom(len.s, Val(o), 0, NumToSmallInt(Val(len).value))
CanonicalizeLocalesFrom(s, o, k, len) ==
  IF k = len THEN Ok(s, <<>>) ELSE
  LET key == Str(NumToString(NumFromInt(k)))
      present == HasProperty(s, o, key)
  IN IF IsAbrupt(present) THEN present
     ELSE IF Val(present) = False THEN CanonicalizeLocalesFrom(present.s, o, k + 1, len) ELSE
     LET value == Get(present.s, o, key) IN IF IsAbrupt(value) THEN value
     ELSE IF ~IsString(Val(value)) /\ ~IsObject(Val(value)) THEN ThrowTypeError(value.s)
     ELSE Unsupported(value.s, N("Unsupported: a locale, whose canonical form is locale data"))

\* The supportedLocalesOf of each constructor: FilterLocales, which reads localeMatcher from its
\* options before it reads the locale data of the requested locales.
FilterLocales(s, requested, options) ==
  LET o == IF options = Undefined THEN OrdinaryObjectCreate(s, Null) ELSE ToObject(s, options) IN IF IsAbrupt(o) THEN o ELSE
  LET matcher == GetStringOption(o.s, Val(o), SV("localeMatcher"), {N("lookup"), N("best fit")}, N("best fit")) IN
  IF IsAbrupt(matcher) THEN matcher
  ELSE IF requested = <<>> THEN CreateArrayFromList(matcher.s, <<>>)
  ELSE Unsupported(matcher.s, N("Unsupported: the locales that the host supports"))

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

\* Intl's functions. A method on an Intl prototype throws the TypeError of RequireInternalSlot, as
\* no Intl object exists, but where it unwraps its receiver first: an object that inherits from the
\* constructor's prototype, through which it would read %Intl%.[[FallbackSymbol]], stops.
IntlBuiltin(s, f, m, this, args, nt) ==
  CASE m \in IntlConstructors ->
         IF nt = Undefined /\ m \notin IntlCallableConstructors THEN ThrowTypeError(s)
         ELSE Unsupported(s, N("Unsupported: an Intl constructor, which reads locale data"))
    [] m = "getCanonicalLocales" ->
         LET list == CanonicalizeLocaleList(s, Arg(args, 1)) IN IF IsAbrupt(list) THEN list ELSE CreateArrayFromList(list.s, Val(list))
    [] m = "supportedValuesOf" ->
         LET key == ToStr(s, Arg(args, 1)) IN IF IsAbrupt(key) THEN key
         ELSE IF Val(key).value \notin {N("calendar"), N("collation"), N("currency"), N("numberingSystem"), N("timeZone"), N("unit")}
         THEN ThrowError(key.s, "RangeError")
         ELSE Unsupported(key.s, N("Unsupported: the values that the host supports"))
    [] m \in IntlSupportedLocalesOf ->
         LET list == CanonicalizeLocaleList(s, Arg(args, 1)) IN IF IsAbrupt(list) THEN list ELSE FilterLocales(list.s, Val(list), Arg(args, 2))
    [] m \in DOMAIN IntlUnwrappingMethods ->
         IF ~IsObject(this) THEN ThrowTypeError(s) ELSE
         LET inherits == OrdinaryHasInstance(s, Intrinsic(s, IntlUnwrappingMethods[m]), this) IN IF IsAbrupt(inherits) THEN inherits
         ELSE IF Val(inherits) = True THEN Unsupported(inherits.s, N("Unsupported: an object that Intl unwraps"))
         ELSE ThrowTypeError(inherits.s)
    [] OTHER -> ThrowTypeError(s)
