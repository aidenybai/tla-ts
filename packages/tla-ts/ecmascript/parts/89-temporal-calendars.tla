\* The calendars other than ISO 8601 that Temporal takes (Intl era and month code proposal), as
\* Node 26 runs them. engine262 has none of them. A calendar date is [year, month, day] of TLA+
\* integers, its month the ordinal in its year, and a month code [month, leap]. The calendars
\* with eras whose months and days are ISO 8601's count their years from another year; the
\* others count days arithmetically, as Node does: the Coptic and the two Ethiopian calendars, of
\* 13 months each, the tabular Islamic calendars, the Indian national calendar, the Persian
\* calendar, and the Hebrew calendar, whose leap years add a month. The Umm al-Qura calendar is
\* the civil Islamic calendar outside the years that Node's table of its months covers. Node
\* computes the Chinese and the Dangi calendars astronomically, so their years and their month-days'
\* reference dates come from the host's tables (HostCalendarYear, HostCalendarMonthDay), and any
\* that the tables leave out stops.
EraCalendars == {N("gregory"), N("buddhist"), N("roc"), N("japanese")}
CopticCalendars == {N("coptic"), N("ethiopic"), N("ethioaa")}
IslamicCalendars == {N("islamic-civil"), N("islamic-tbla"), N("islamic-umalqura")}
LunisolarCalendars == {N("chinese"), N("dangi")}
ArithmeticCalendars ==
  CopticCalendars \cup IslamicCalendars \cup LunisolarCalendars \cup {N("indian"), N("persian"), N("hebrew")}

\* CanonicalizeCalendar, with the aliases Node takes.
CanonicalizeCalendar(s, id) ==
  LET lower == TPLower(id) IN
  CASE lower \in {ISO8601} \cup EraCalendars \cup ArithmeticCalendars -> Ok(s, lower)
    [] lower = N("islamicc") -> Ok(s, N("islamic-civil"))
    [] lower = N("ethiopic-amete-alem") -> Ok(s, N("ethioaa"))
    [] OTHER -> ThrowError(s, "RangeError")

\* What a calendar's arithmetic year adds to the ISO year, where its months are ISO 8601's.
CalendarYearOffset(cal) == CASE cal = N("buddhist") -> 543 [] cal = N("roc") -> -1911 [] OTHER -> 0

\* The day of an ISO date counted from day 1 of the proleptic Gregorian calendar, and back.
RataDie(date) == EpochDays(date) + 719163
RataDieToISODate(day) == EpochDaysToISODate(day - 719163)

\* The day before a Coptic or an Ethiopian year 1 starts, and a year in its Amete Mihret count.
CopticEpoch(cal) == IF cal = N("coptic") THEN 103604 ELSE 2795
CopticYear(cal, year) == IF cal = N("ethioaa") THEN year - 5500 ELSE year

\* The day before a tabular Islamic year 1 starts, on its Friday or its Thursday epoch.
IslamicEpoch(cal) == IF cal = N("islamic-tbla") THEN 227013 ELSE 227014

\* The years 1300 to 1600 of the Umm al-Qura calendar, as Node's table gives them: each year's 30-day
\* months as bits, and the days from the start of 1300, which the civil calendar starts on too, to
\* the start of each year through 1601, where the civil calendar takes over again.
UmalquraMonths ==
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
UmalquraStarts ==
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
IsUmalquraTable(cal, year) == cal = N("islamic-umalqura") /\ year >= 1300 /\ year <= 1600
UmalquraLong(year, month) == (UmalquraMonths[year - 1299] \div 2 ^ (month - 1)) % 2 = 1

\* The day that an Indian year starts on, in March of its Gregorian year, and the days before a month.
IndianStart(year) == RataDie([year |-> year + 78, month |-> 3, day |-> IF IsLeapYear(year + 78) THEN 21 ELSE 22])
IndianBefore(year, month) ==
  LET first == IF IsLeapYear(year + 78) THEN 31 ELSE 30 IN
  CASE month = 1 -> 0
    [] month <= 7 -> first + 31 * (month - 2)
    [] OTHER -> first + 155 + 30 * (month - 7)

\* The Persian years that the 33-year rule makes leap years but Node's calendar doesn't, which moves
\* each one's leap day to the next year.
PersianCorrections ==
  {1502, 1601, 1634, 1667, 1700, 1733, 1766, 1799, 1832, 1865, 1898, 1931, 1964, 1997, 2030, 2059,
   2063, 2096, 2129, 2158, 2162, 2191, 2195, 2224, 2228, 2257, 2261, 2290, 2294, 2323, 2327, 2356,
   2360, 2389, 2393, 2422, 2426, 2455, 2459, 2488, 2492, 2521, 2525, 2554, 2558, 2587, 2591, 2620,
   2624, 2653, 2657, 2686, 2690, 2719, 2723, 2748, 2752, 2756, 2781, 2785, 2789, 2818, 2822, 2847,
   2851, 2855, 2880, 2884, 2888, 2913, 2917, 2921, 2946, 2950, 2954, 2979, 2983, 2987}
PersianLeap(year) ==
  CASE year \in PersianCorrections -> FALSE
    [] year - 1 \in PersianCorrections -> TRUE
    [] OTHER -> (25 * year + 11) % 33 < 8
\* The rata die that a Persian year starts on, and the Persian year of a rata die, from an estimate
\* within a year or two.
PersianStart(year) ==
  226895 + 365 * (year - 1) + (8 * year + 21) \div 33 - (IF year - 1 \in PersianCorrections THEN 1 ELSE 0)
PersianYearAt(day, year) ==
  CASE PersianStart(year) > day -> PersianYearAt(day, year - 1)
    [] PersianStart(year + 1) <= day -> PersianYearAt(day, year + 1)
    [] OTHER -> year

\* The Hebrew months before a year, and the days from its epoch to the year's molad, delayed as the
\* calendar delays it, which splits the parts of an hour that a TLA+ integer wouldn't hold.
HebrewMonthsBefore(year) == (235 * year - 234) \div 19
HebrewElapsed(year) ==
  LET months == HebrewMonthsBefore(year)
      days == 29 * months + 13753 * (months \div 25920) + (12084 + 13753 * (months % 25920)) \div 25920
  IN IF (3 * (days + 1)) % 7 < 3 THEN days + 1 ELSE days
\* The rata die that a Hebrew year starts on, which the lengths of its neighbours delay.
HebrewNewYear(year) ==
  LET before == HebrewElapsed(year - 1)
      elapsed == HebrewElapsed(year)
      after == HebrewElapsed(year + 1)
  IN -1373427 + elapsed + (CASE after - elapsed = 356 -> 2 [] elapsed - before = 382 -> 1 [] OTHER -> 0)
HebrewLength(year) == HebrewNewYear(year + 1) - HebrewNewYear(year)

\* A year of the Chinese or the Dangi calendar from the host's table: the epoch days of its first
\* day, the ordinal of its leap month or 0, and its months of 30 days as bits from the first's.
LunisolarYear(cal, year) ==
  LET entry == HostCalendarYear(<<cal, year>>) IN
  IF entry.found = "year" THEN entry
  ELSE Assert(FALSE, "tla-ts can't tell the months of a Chinese or Dangi year that the host's table leaves out")
LunisolarDays(cal, year, month) == IF (LunisolarYear(cal, year).long \div 2 ^ (month - 1)) % 2 = 1 THEN 30 ELSE 29
LunisolarBefore(cal, year, month) ==
  IF month = 1 THEN 0 ELSE LunisolarBefore(cal, year, month - 1) + LunisolarDays(cal, year, month - 1)

\* The month code of a month of a Chinese or Dangi year, whose leap month repeats the month before
\* it, and the month that a month code the year has is.
LunisolarMonthCode(cal, year, month) ==
  LET leap == LunisolarYear(cal, year).leap IN
  CASE leap = 0 \/ month < leap -> [month |-> month, leap |-> FALSE]
    [] month = leap -> [month |-> month - 1, leap |-> TRUE]
    [] OTHER -> [month |-> month - 1, leap |-> FALSE]
LunisolarOrdinal(cal, year, code) ==
  LET leap == LunisolarYear(cal, year).leap IN
  CASE code.leap -> leap
    [] leap = 0 \/ code.month < leap -> code.month
    [] OTHER -> code.month + 1

\* CalendarDateInLeapYear and CalendarMonthsInYear of an arithmetic calendar's year.
ArithmeticLeap(cal, year) ==
  CASE cal \in CopticCalendars -> CopticYear(cal, year) % 4 = 3
    [] cal \in LunisolarCalendars -> LunisolarYear(cal, year).leap # 0
    [] IsUmalquraTable(cal, year) -> UmalquraStarts[year - 1298] - UmalquraStarts[year - 1299] = 355
    [] cal \in IslamicCalendars -> (14 + 11 * year) % 30 < 11
    [] cal = N("hebrew") -> (7 * year + 1) % 19 < 7
    [] cal = N("persian") -> PersianLeap(year)
    [] OTHER -> IsLeapYear(year + 78)
ArithmeticMonths(cal, year) ==
  CASE cal \in CopticCalendars -> 13
    [] cal \in LunisolarCalendars \cup {N("hebrew")} -> IF ArithmeticLeap(cal, year) THEN 13 ELSE 12
    [] OTHER -> 12

\* The month code of a month of a year, and the month that a month code is in a year that has it.
\* A Hebrew leap year inserts Adar I, M05L, before Adar, M06.
ArithmeticMonthCode(cal, year, month) ==
  CASE cal \in LunisolarCalendars -> LunisolarMonthCode(cal, year, month)
    [] cal # N("hebrew") \/ ~ArithmeticLeap(cal, year) \/ month <= 5 -> [month |-> month, leap |-> FALSE]
    [] month = 6 -> [month |-> 5, leap |-> TRUE]
    [] OTHER -> [month |-> month - 1, leap |-> FALSE]
ArithmeticOrdinal(cal, year, code) ==
  CASE cal \in LunisolarCalendars -> LunisolarOrdinal(cal, year, code)
    [] cal # N("hebrew") \/ ~ArithmeticLeap(cal, year) \/ (code.month <= 5 /\ ~code.leap) -> code.month
    [] code.leap -> 6
    [] OTHER -> code.month + 1

\* IsValidMonthCodeForCalendar, YearContainsMonthCode of an arithmetic calendar, and the month code
\* that a month code the year lacks is constrained to: a Chinese or Dangi leap month to the month it
\* would repeat, and the Hebrew Adar I to Adar.
IsValidMonthCodeForCalendar(cal, code) ==
  CASE cal = N("hebrew") -> (~code.leap /\ code.month <= 12) \/ (code.leap /\ code.month = 5)
    [] cal \in CopticCalendars -> ~code.leap /\ code.month <= 13
    [] cal \in LunisolarCalendars -> code.month >= 1 /\ code.month <= 12
    [] OTHER -> ~code.leap /\ code.month <= 12
YearContainsMonthCode(cal, year, code) ==
  ~code.leap \/ IF cal \in LunisolarCalendars THEN LunisolarYear(cal, year).leap = code.month + 1 ELSE ArithmeticLeap(cal, year)
ConstrainMonthCode(cal, year, code) ==
  CASE YearContainsMonthCode(cal, year, code) -> code
    [] cal \in LunisolarCalendars -> [month |-> code.month, leap |-> FALSE]
    [] OTHER -> [month |-> 6, leap |-> FALSE]

\* The days of a month of a Hebrew year, by its code: Heshvan and Kislev give a year its length.
HebrewDays(year, code) ==
  CASE code.leap -> 30
    [] code.month = 2 -> IF HebrewLength(year) % 10 = 5 THEN 30 ELSE 29
    [] code.month = 3 -> IF HebrewLength(year) % 10 = 3 THEN 29 ELSE 30
    [] OTHER -> IF code.month % 2 = 1 THEN 30 ELSE 29
ArithmeticDaysInMonth(cal, year, month) ==
  CASE cal \in CopticCalendars -> IF month = 13 THEN (IF ArithmeticLeap(cal, year) THEN 6 ELSE 5) ELSE 30
    [] cal \in LunisolarCalendars -> LunisolarDays(cal, year, month)
    [] IsUmalquraTable(cal, year) -> IF UmalquraLong(year, month) THEN 30 ELSE 29
    [] cal \in IslamicCalendars -> IF month % 2 = 1 \/ (month = 12 /\ ArithmeticLeap(cal, year)) THEN 30 ELSE 29
    [] cal = N("hebrew") -> HebrewDays(year, ArithmeticMonthCode(cal, year, month))
    [] cal = N("persian") -> CASE month <= 6 -> 31 [] month <= 11 -> 30 [] OTHER -> IF ArithmeticLeap(cal, year) THEN 30 ELSE 29
    [] month = 1 -> IF ArithmeticLeap(cal, year) THEN 31 ELSE 30
    [] OTHER -> IF month <= 6 THEN 31 ELSE 30
\* The days of the month of a code in the year where it's longest.
ArithmeticMostDays(cal, code) ==
  CASE cal \in CopticCalendars -> IF code.month = 13 THEN 6 ELSE 30
    [] cal = N("islamic-umalqura") -> 30
    [] cal \in IslamicCalendars -> IF code.month % 2 = 1 \/ code.month = 12 THEN 30 ELSE 29
    [] cal = N("hebrew") -> IF code.month % 2 = 1 \/ code.leap \/ code.month \in {2, 3} THEN 30 ELSE 29
    [] OTHER -> IF code.month <= 6 THEN 31 ELSE 30

\* The days of the months of a Hebrew year, or of an Umm al-Qura year in Node's table, before one.
HebrewBefore(year, month) ==
  IF month = 1 THEN 0 ELSE HebrewBefore(year, month - 1) + ArithmeticDaysInMonth(N("hebrew"), year, month - 1)
UmalquraBefore(year, month) ==
  IF month = 1 THEN 0 ELSE UmalquraBefore(year, month - 1) + IF UmalquraLong(year, month - 1) THEN 30 ELSE 29

\* The rata die of a valid date of an arithmetic calendar.
ArithmeticRataDie(cal, year, month, day) ==
  LET coptic == CopticYear(cal, year) IN
  CASE cal \in CopticCalendars -> CopticEpoch(cal) + 365 * (coptic - 1) + coptic \div 4 + 30 * (month - 1) + day
    [] IsUmalquraTable(cal, year) -> 687337 + UmalquraStarts[year - 1299] + UmalquraBefore(year, month) + day - 1
    [] cal \in IslamicCalendars ->
         IslamicEpoch(cal) + (year - 1) * 354 + (3 + 11 * year) \div 30 + 29 * (month - 1) + month \div 2 + day
    [] cal = N("hebrew") -> HebrewNewYear(year) + HebrewBefore(year, month) + day - 1
    [] cal \in LunisolarCalendars -> LunisolarYear(cal, year).start + 719163 + LunisolarBefore(cal, year, month) + day - 1
    [] cal = N("persian") ->
         PersianStart(year) + (IF month <= 7 THEN 31 * (month - 1) ELSE 186 + 30 * (month - 7)) + day - 1
    [] OTHER -> IndianStart(year) + IndianBefore(year, month) + day - 1

\* The Hebrew year of a rata die, from an estimate within a few years, and the Umm al-Qura year of
\* one, from its civil year, which is within a year of it.
HebrewYearAt(day, year) ==
  CASE HebrewNewYear(year) > day -> HebrewYearAt(day, year - 1)
    [] HebrewNewYear(year + 1) <= day -> HebrewYearAt(day, year + 1)
    [] OTHER -> year
UmalquraYearAt(day, year) ==
  CASE ArithmeticRataDie(N("islamic-umalqura"), year, 1, 1) > day -> UmalquraYearAt(day, year - 1)
    [] ArithmeticRataDie(N("islamic-umalqura"), year + 1, 1, 1) <= day -> UmalquraYearAt(day, year + 1)
    [] OTHER -> year

\* The month of a year that a day of the year, counted from 0, is in.
ArithmeticMonthAt(cal, year, month, within) ==
  IF within < ArithmeticDaysInMonth(cal, year, month) THEN month
  ELSE ArithmeticMonthAt(cal, year, month + 1, within - ArithmeticDaysInMonth(cal, year, month))

\* The date of an arithmetic calendar on a rata die, which splits each product that a TLA+ integer
\* wouldn't hold.
ArithmeticDateOf(cal, day) ==
  LET copticDays == day - CopticEpoch(cal) - 1
      coptic == 4 * (copticDays \div 1461) + (4 * (copticDays % 1461) + 1463) \div 1461
      islamicDays == day - IslamicEpoch(cal) - 1
      islamic == 30 * (islamicDays \div 10631) + (30 * (islamicDays % 10631) + 10646) \div 10631
      gregorian == RataDieToISODate(day).year
      year == CASE cal \in CopticCalendars -> IF cal = N("ethioaa") THEN coptic + 5500 ELSE coptic
                [] cal = N("islamic-umalqura") -> UmalquraYearAt(day, islamic)
                [] cal \in IslamicCalendars -> islamic
                [] cal = N("hebrew") -> HebrewYearAt(day, ((day + 1373427) * 19) \div 6940 + 1)
                [] cal \in LunisolarCalendars -> IF day < ArithmeticRataDie(cal, gregorian, 1, 1) THEN gregorian - 1 ELSE gregorian
                [] cal = N("persian") ->
                     PersianYearAt(day, 33 * ((day - 226895) \div 12053) + (33 * ((day - 226895) % 12053)) \div 12053 + 1)
                [] OTHER -> IF day < IndianStart(gregorian - 78) THEN gregorian - 79 ELSE gregorian - 78
      within == day - ArithmeticRataDie(cal, year, 1, 1)
      first == ArithmeticDaysInMonth(cal, year, 1)
      month == CASE cal \in CopticCalendars -> within \div 30 + 1
                 [] cal \in LunisolarCalendars \cup {N("hebrew"), N("persian"), N("islamic-umalqura")} ->
                      ArithmeticMonthAt(cal, year, 1, within)
                 [] cal \in IslamicCalendars -> (11 * within + 330) \div 325
                 [] within < first -> 1
                 [] within < first + 155 -> 2 + (within - first) \div 31
                 [] OTHER -> 7 + (within - first - 155) \div 30
  IN [year |-> year, month |-> month, day |-> day - ArithmeticRataDie(cal, year, month, 1) + 1]

\* The months of an arithmetic calendar before a year's month, and the year and the month of a
\* count of them.
MonthIndex(cal, year, month) ==
  IF cal = N("hebrew") THEN HebrewMonthsBefore(year) + month - 1 ELSE year * ArithmeticMonths(cal, 0) + month - 1
HebrewYearOfIndex(index, year) ==
  CASE HebrewMonthsBefore(year) > index -> HebrewYearOfIndex(index, year - 1)
    [] HebrewMonthsBefore(year + 1) <= index -> HebrewYearOfIndex(index, year + 1)
    [] OTHER -> year
OfMonthIndex(cal, index) ==
  LET count == ArithmeticMonths(cal, 0)
      year == HebrewYearOfIndex(index, (19 * index + 234) \div 235)
  IN IF cal = N("hebrew") THEN [year |-> year, month |-> index - HebrewMonthsBefore(year) + 1]
     ELSE [year |-> index \div count, month |-> (index % count) + 1]

\* The months of a Chinese or Dangi calendar from an earlier year's first month to a year's, and
\* the year and the month that a count of months after a year's month reaches, a year at a time.
LunisolarMonthsFrom(cal, first, year) ==
  IF year = first THEN 0 ELSE LunisolarMonthsFrom(cal, first, year - 1) + ArithmeticMonths(cal, year - 1)
LunisolarAfter(cal, year, month, count) ==
  LET months == ArithmeticMonths(cal, year) IN
  CASE month + count > months -> LunisolarAfter(cal, year + 1, 1, count - (months - month + 1))
    [] month + count < 1 -> LunisolarAfter(cal, year - 1, ArithmeticMonths(cal, year - 1), count + month)
    [] OTHER -> [year |-> year, month |-> month + count]

\* The year and the month that a count of months after a year's month of an arithmetic calendar
\* reaches, and the months from one year's month, [year, month], to another's.
MonthsAfter(cal, year, month, count) ==
  IF cal \in LunisolarCalendars THEN LunisolarAfter(cal, year, month, count)
  ELSE OfMonthIndex(cal, MonthIndex(cal, year, month) + count)
MonthsBetween(cal, one, two) ==
  LET first == IF one.year < two.year THEN one.year ELSE two.year IN
  IF cal \in LunisolarCalendars
  THEN LunisolarMonthsFrom(cal, first, two.year) + two.month - LunisolarMonthsFrom(cal, first, one.year) - one.month
  ELSE MonthIndex(cal, two.year, two.month) - MonthIndex(cal, one.year, one.month)

\* Whether a year of an arithmetic calendar has a date within the limits.
ArithmeticYearWithinLimits(cal, year) ==
  LET months == ArithmeticMonths(cal, year) IN
  ArithmeticRataDie(cal, year, 1, 1) - 719163 <= 100000000 /\
  ArithmeticRataDie(cal, year, months, ArithmeticDaysInMonth(cal, year, months)) - 719163 >= -100000001

\* The reference date of a month code and a day of an arithmetic calendar: the latest that is in
\* 1972 or before, from a year of the calendar.
ArithmeticReferenceYear(cal) == ArithmeticDateOf(cal, RataDie([year |-> 1972, month |-> 12, day |-> 31])).year
ArithmeticReference(cal, year, code, day) ==
  LET month == ArithmeticOrdinal(cal, year, code) IN
  IF YearContainsMonthCode(cal, year, code) /\ day <= ArithmeticDaysInMonth(cal, year, month) /\
     ArithmeticRataDie(cal, year, month, day) <= RataDie([year |-> 1972, month |-> 12, day |-> 31])
  THEN RataDieToISODate(ArithmeticRataDie(cal, year, month, day))
  ELSE ArithmeticReference(cal, year - 1, code, day)

\* The Japanese calendar's eras from 1873, with the ISO date each starts on and its first year.
JapaneseEras ==
  <<[name |-> N("meiji"), start |-> [year |-> 1873, month |-> 1, day |-> 1], first |-> 1868],
    [name |-> N("taisho"), start |-> [year |-> 1912, month |-> 7, day |-> 30], first |-> 1912],
    [name |-> N("showa"), start |-> [year |-> 1926, month |-> 12, day |-> 25], first |-> 1926],
    [name |-> N("heisei"), start |-> [year |-> 1989, month |-> 1, day |-> 8], first |-> 1989],
    [name |-> N("reiwa"), start |-> [year |-> 2019, month |-> 5, day |-> 1], first |-> 2019]>>

\* CanonicalizeEraInCalendar, or Empty where the calendar has no such era.
CanonicalizeEraInCalendar(cal, era) ==
  CASE cal \in {N("coptic"), N("ethiopic"), N("hebrew")} /\ era = N("am") -> era
    [] cal = N("persian") /\ era = N("ap") -> era
    [] cal \in {N("ethiopic"), N("ethioaa")} /\ era = N("aa") -> era
    [] cal = N("indian") /\ era = N("shaka") -> era
    [] cal \in IslamicCalendars /\ era \in {N("ah"), N("bh")} -> era
    [] cal \in {N("gregory"), N("japanese")} /\ era \in {N("ce"), N("ad")} -> N("ce")
    [] cal \in {N("gregory"), N("japanese")} /\ era \in {N("bce"), N("bc")} -> N("bce")
    [] cal = N("japanese") /\ \E i \in DOMAIN JapaneseEras : JapaneseEras[i].name = era -> era
    [] cal = N("buddhist") /\ era = N("be") -> era
    [] cal = N("roc") /\ era \in {N("roc"), N("broc")} -> era
    [] OTHER -> Empty

\* CalendarDateArithmeticYearForEraYear, of a BigInt era year: an era of the negative kind counts
\* back from the year before its epoch, a Japanese era from 1873 counts from the year it starts in,
\* and the Ethiopian calendar's Amete Alem era counts from 5500 years before its Amete Mihret era.
CalendarDateArithmeticYearForEraYear(cal, era, eraYear) ==
  LET japanese == SelectSeq(JapaneseEras, LAMBDA entry : entry.name = era) IN
  CASE era \in {N("bce"), N("broc"), N("bh")} -> TISub(TI(1), eraYear)
    [] cal = N("ethiopic") /\ era = N("aa") -> TISub(eraYear, TI(5500))
    [] japanese # <<>> -> TIAdd(eraYear, TI(Head(japanese).first - 1))
    [] OTHER -> eraYear

\* CalendarDateEra and CalendarDateEraYear of an ISO date, of its arithmetic year, as [era, eraYear].
CalendarDateEra(cal, date, year) ==
  LET started == SelectSeq(JapaneseEras, LAMBDA entry : CompareISODate(date, entry.start) >= 0) IN
  CASE cal = N("buddhist") -> [era |-> N("be"), eraYear |-> year]
    [] cal \in {N("coptic"), N("hebrew")} -> [era |-> N("am"), eraYear |-> year]
    [] cal = N("ethioaa") -> [era |-> N("aa"), eraYear |-> year]
    [] cal = N("indian") -> [era |-> N("shaka"), eraYear |-> year]
    [] cal = N("persian") -> [era |-> N("ap"), eraYear |-> year]
    [] cal = N("ethiopic") -> IF year >= 1 THEN [era |-> N("am"), eraYear |-> year] ELSE [era |-> N("aa"), eraYear |-> year + 5500]
    [] cal \in IslamicCalendars -> IF year >= 1 THEN [era |-> N("ah"), eraYear |-> year] ELSE [era |-> N("bh"), eraYear |-> 1 - year]
    [] cal = N("japanese") /\ started # <<>> ->
         [era |-> started[Len(started)].name, eraYear |-> year - started[Len(started)].first + 1]
    [] year >= 1 -> [era |-> IF cal = N("roc") THEN N("roc") ELSE N("ce"), eraYear |-> year]
    [] OTHER -> [era |-> IF cal = N("roc") THEN N("broc") ELSE N("bce"), eraYear |-> 1 - year]

\* Whether a calendar has eras, which its dates' era and eraYear give and its fields read.
CalendarHasEras(cal) == cal \notin {ISO8601} \cup LunisolarCalendars

\* The calendar date of an ISO date, and its month code.
CalendarParts(cal, date) ==
  IF cal \in ArithmeticCalendars THEN ArithmeticDateOf(cal, RataDie(date))
  ELSE [year |-> date.year + CalendarYearOffset(cal), month |-> date.month, day |-> date.day]
CalendarMonthCode(cal, parts) ==
  IF cal \in ArithmeticCalendars THEN ArithmeticMonthCode(cal, parts.year, parts.month) ELSE [month |-> parts.month, leap |-> FALSE]

\* The month code of a fields record's monthCode units, or Empty.
MonthCodeOf(units) == IF units = Empty THEN Empty ELSE [month |-> TPInt(units, 2, 3), leap |-> Len(units) = 4]

\* MonthCodeToOrdinal of a month code that the year has, as ConstrainMonthCode constrains it.
MonthCodeToOrdinal(cal, year, code) ==
  IF cal \in ArithmeticCalendars THEN ArithmeticOrdinal(cal, year, ConstrainMonthCode(cal, year, code)) ELSE code.month

\* CalendarISOToDate's fields that the getters of PlainDate and kin read.
CalendarDateGetter(s, cal, date, m) ==
  LET parts == CalendarParts(cal, date)
      isArithmetic == cal \in ArithmeticCalendars
  IN CASE m \in {"era", "eraYear"} ->
            IF ~CalendarHasEras(cal) THEN Ok(s, Undefined)
            ELSE LET era == CalendarDateEra(cal, date, parts.year) IN
                 Ok(s, IF m = "era" THEN Str(era.era) ELSE IntV(era.eraYear))
       [] m = "year" -> Ok(s, IntV(parts.year))
       [] m = "month" -> Ok(s, IntV(parts.month))
       [] m = "monthCode" ->
            LET code == CalendarMonthCode(cal, parts) IN Ok(s, Str(CreateMonthCode(code.month, code.leap)))
       [] m = "day" -> Ok(s, IntV(parts.day))
       [] m = "dayOfWeek" -> Ok(s, IntV(ISODayOfWeek(date)))
       [] m = "dayOfYear" ->
            Ok(s, IntV(IF isArithmetic THEN RataDie(date) - ArithmeticRataDie(cal, parts.year, 1, 1) + 1 ELSE ISODayOfYear(date)))
       [] m \in {"weekOfYear", "yearOfWeek"} ->
            IF cal # ISO8601 THEN Ok(s, Undefined)
            ELSE Ok(s, IntV(IF m = "weekOfYear" THEN ISOWeekOfYear(date).week ELSE ISOWeekOfYear(date).year))
       [] m = "daysInWeek" -> Ok(s, IntV(7))
       [] m = "daysInMonth" ->
            Ok(s, IntV(IF isArithmetic THEN ArithmeticDaysInMonth(cal, parts.year, parts.month) ELSE ISODaysInMonth(date.year, date.month)))
       [] m = "daysInYear" ->
            Ok(s, IntV(CASE cal \in LunisolarCalendars -> LunisolarBefore(cal, parts.year, ArithmeticMonths(cal, parts.year) + 1)
                         [] isArithmetic -> ArithmeticRataDie(cal, parts.year + 1, 1, 1) - ArithmeticRataDie(cal, parts.year, 1, 1)
                         [] IsLeapYear(date.year) -> 366
                         [] OTHER -> 365))
       [] m = "monthsInYear" -> Ok(s, IntV(IF isArithmetic THEN ArithmeticMonths(cal, parts.year) ELSE 12))
       [] m = "inLeapYear" -> Ok(s, Bool(IF isArithmetic THEN ArithmeticLeap(cal, parts.year) ELSE IsLeapYear(date.year)))
CalendarDateGetters ==
  {"era", "eraYear", "year", "month", "monthCode", "day", "dayOfWeek", "dayOfYear", "weekOfYear", "yearOfWeek",
   "daysInWeek", "daysInMonth", "daysInYear", "monthsInYear", "inLeapYear"}

\* ISODateToFields, for type "date", "year-month", or "month-day": the calendar year, month code, and
\* day. It leaves out the month, whose number gives another month code in another Hebrew year.
ISODateToFields(cal, date, type) ==
  LET parts == CalendarParts(cal, date)
      code == CalendarMonthCode(cal, parts)
  IN [EmptyCalendarFields EXCEPT !.monthCode = CreateMonthCode(code.month, code.leap),
                                 !.day = IF type \in {"date", "month-day"} THEN TI(parts.day) ELSE Empty,
                                 !.year = IF type \in {"date", "year-month"} THEN TI(parts.year) ELSE Empty]

\* CalendarResolveFields of a calendar other than ISO 8601 (NonISOResolveFields): the fields with
\* year set to the arithmetic year that the year or the era and the era year give, and month to the
\* month's ordinal.
NonISOResolveFields(s, cal, fields, type) ==
  LET code == MonthCodeOf(fields.monthCode)
      era == IF fields.era = Empty THEN Empty ELSE CanonicalizeEraInCalendar(cal, fields.era)
      year == IF fields.eraYear = Empty \/ era = Empty THEN fields.year
              ELSE CalendarDateArithmeticYearForEraYear(cal, era, fields.eraYear)
      ordinal == IF year = Empty THEN code.month ELSE MonthCodeToOrdinal(cal, TIClamp(year, -1000000, 1000000), code)
  IN CASE (type \in {"date", "year-month"} \/ code = Empty \/ fields.month # Empty) /\ fields.year = Empty /\
          (fields.era = Empty \/ fields.eraYear = Empty) -> ThrowTypeError(s)
       [] (fields.era = Empty) # (fields.eraYear = Empty) -> ThrowTypeError(s)
       [] type \in {"date", "month-day"} /\ fields.day = Empty -> ThrowTypeError(s)
       [] fields.month = Empty /\ code = Empty -> ThrowTypeError(s)
       [] fields.eraYear # Empty /\ era = Empty -> ThrowError(s, "RangeError")
       [] fields.eraYear # Empty /\ fields.year # Empty /\ fields.year # year -> ThrowError(s, "RangeError")
       [] code # Empty /\ ~(IF cal \in ArithmeticCalendars THEN IsValidMonthCodeForCalendar(cal, code) ELSE ~code.leap /\ code.month <= 12) ->
            ThrowError(s, "RangeError")
       [] year # Empty /\ fields.month # Empty /\ code # Empty /\ fields.month # TI(ordinal) -> ThrowError(s, "RangeError")
       [] OTHER -> Ok(s, [fields EXCEPT !.year = year, !.month = IF code = Empty THEN fields.month ELSE TI(ordinal)])

\* CalendarDateToISO of a resolved year and month and a day, BigInts, and the month code that the
\* fields gave, or Empty. A month code that the year lacks is constrained or rejected.
CalendarDateToISO(s, cal, year, month, day, code, overflow) ==
  IF cal \notin ArithmeticCalendars THEN
    LET iso == TISub(year, TI(CalendarYearOffset(cal))) IN
    IF ~TIYearInRange(iso) THEN ThrowError(s, "RangeError") ELSE RegulateISODate(s, TIToInt(iso), month, day, overflow)
  ELSE IF ~TIYearInRange(year) THEN ThrowError(s, "RangeError") ELSE
  LET y == TIToInt(year)
      months == ArithmeticMonths(cal, y)
      m == TIClamp(month, 1, months)
      days == ArithmeticDaysInMonth(cal, y, m)
  IN IF overflow = N("reject") /\
        ((code # Empty /\ ~YearContainsMonthCode(cal, y, code)) \/ BigIntLess(TI(months), month) \/ BigIntLess(TI(days), day))
     THEN ThrowError(s, "RangeError")
     ELSE Ok(s, RataDieToISODate(ArithmeticRataDie(cal, y, m, TIClamp(day, 1, days))))

\* The reference date of a Chinese or Dangi month code and day from the host's table, which gives
\* the month-day that they're constrained to where no year near 1972 has them.
LunisolarReference(s, cal, code, day, overflow) ==
  LET entry == HostCalendarMonthDay(<<cal, code.month, code.leap, day>>) IN
  CASE entry.found # "monthDay" ->
         Assert(FALSE, "tla-ts can't tell the reference date of a Chinese or Dangi month-day that the host's table leaves out")
    [] overflow = N("reject") /\ ~entry.isKept -> ThrowError(s, "RangeError")
    [] OTHER -> Ok(s, EpochDaysToISODate(entry.days))

\* CalendarMonthDayToISOReferenceDate of a calendar other than ISO 8601, of resolved fields, whose
\* year, where they give one, only decides how long the month is, and must be within the limits.
\* A calendar whose months are ISO 8601's takes 1972 as the reference year.
NonISOMonthDayToISOReferenceDate(s, cal, fields, overflow) ==
  IF cal \in LunisolarCalendars /\ fields.year = Empty THEN
    IF overflow = N("reject") /\ BigIntLess(TI(30), fields.day) THEN ThrowError(s, "RangeError")
    ELSE LunisolarReference(s, cal, MonthCodeOf(fields.monthCode), TIClamp(fields.day, 1, 30), overflow)
  ELSE IF cal \notin ArithmeticCalendars THEN
    LET year == IF fields.year = Empty THEN Empty ELSE TISub(fields.year, TI(CalendarYearOffset(cal))) IN
    IF year # Empty /\ (BigIntLess(year, TI(-271821)) \/ BigIntLess(TI(275760), year)) THEN ThrowError(s, "RangeError") ELSE
    LET date == RegulateISODate(s, IF year = Empty THEN 1972 ELSE TIToInt(TIMod(year, TI(400))), fields.month, fields.day, overflow) IN
    IF IsAbrupt(date) THEN date ELSE Ok(s, [year |-> 1972, month |-> Val(date).month, day |-> Val(date).day])
  ELSE
  LET y == IF fields.year = Empty THEN 0 ELSE TIClamp(fields.year, -1000000, 1000000)
      months == IF fields.year = Empty THEN 13 ELSE ArithmeticMonths(cal, y)
      month == TIClamp(fields.month, 1, months)
      given == MonthCodeOf(fields.monthCode)
      code == CASE fields.year = Empty -> given
                [] given = Empty -> ArithmeticMonthCode(cal, y, month)
                [] OTHER -> ConstrainMonthCode(cal, y, given)
      days == IF fields.year = Empty THEN ArithmeticMostDays(cal, code) ELSE ArithmeticDaysInMonth(cal, y, month)
  IN IF fields.year # Empty /\ ~(TIYearInRange(fields.year) /\ ArithmeticYearWithinLimits(cal, y)) THEN ThrowError(s, "RangeError")
     ELSE IF overflow = N("reject") /\
             ((fields.year # Empty /\ given # Empty /\ ~YearContainsMonthCode(cal, y, given)) \/
              BigIntLess(TI(months), fields.month) \/ BigIntLess(TI(days), fields.day))
     THEN ThrowError(s, "RangeError")
     ELSE IF cal \in LunisolarCalendars THEN LunisolarReference(s, cal, code, TIClamp(fields.day, 1, days), overflow)
     ELSE Ok(s, ArithmeticReference(cal, ArithmeticReferenceYear(cal), code, TIClamp(fields.day, 1, days)))

\* NonISODateAdd of an arithmetic calendar, for a date duration, whose fields share a sign. Past
\* the bounds checked first, every result is out of range.
NonISODateAdd(s, cal, date, duration, overflow) ==
  LET days == TIAdd(duration[4], TIMul(TI(7), duration[3])) IN
  IF BigIntLess(TI(600000), TIAbs(duration[1])) \/ BigIntLess(TI(20000000), TIAbs(duration[2])) \/
     BigIntLess(TI(250000000), TIAbs(days)) THEN ThrowError(s, "RangeError") ELSE
  LET parts == CalendarParts(cal, date)
      code == ArithmeticMonthCode(cal, parts.year, parts.month)
      year == parts.year + TIToInt(duration[1])
  IN IF year < -1000000 \/ year > 1000000 THEN ThrowError(s, "RangeError")
     ELSE IF overflow = N("reject") /\ ~YearContainsMonthCode(cal, year, code) THEN ThrowError(s, "RangeError") ELSE
  LET to == MonthsAfter(cal, year, MonthCodeToOrdinal(cal, year, code), TIToInt(duration[2])) IN
  IF to.year < -1000000 \/ to.year > 1000000 THEN ThrowError(s, "RangeError") ELSE
  LET length == ArithmeticDaysInMonth(cal, to.year, to.month) IN
  IF overflow = N("reject") /\ parts.day > length THEN ThrowError(s, "RangeError") ELSE
  LET start == ArithmeticRataDie(cal, to.year, to.month, IF parts.day > length THEN length ELSE parts.day) - 719163
      total == start + TIToInt(days)
  IN IF total < -100000001 \/ total > 100000000 THEN ThrowError(s, "RangeError") ELSE
     LET result == EpochDaysToISODate(total) IN IF ISODateWithinLimits(result) THEN Ok(s, result) ELSE ThrowError(s, "RangeError")

\* NonISODateUntil of an arithmetic calendar: the most years and then months that don't pass the
\* later date, as NonISODateSurpasses finds them from a guess that's within one of them, and the
\* days left. from and to are calendar dates, code from's month code; a month code orders by its
\* month and then whether it's a leap month.
MonthCodeKey(code) == code.month * 2 + (IF code.leap THEN 1 ELSE 0)
NonISOReached(cal, from, code, years, months) ==
  LET year == from.year + years IN MonthsAfter(cal, year, MonthCodeToOrdinal(cal, year, code), months)
NonISODateSurpasses(cal, sign, from, code, to, years, months) ==
  \/ sign * CompareFieldsFrom(<<from.year + years, MonthCodeKey(code), from.day>>,
                              <<to.year, MonthCodeKey(ArithmeticMonthCode(cal, to.year, to.month)), to.day>>, 1) > 0
  \/ LET at == NonISOReached(cal, from, code, years, months) IN
     sign * CompareFieldsFrom(<<at.year, at.month, from.day>>, <<to.year, to.month, to.day>>, 1) > 0
NonISOBackYears(cal, sign, from, code, to, count) ==
  IF count = 0 \/ ~NonISODateSurpasses(cal, sign, from, code, to, count, 0) THEN count
  ELSE NonISOBackYears(cal, sign, from, code, to, count - sign)
NonISOForeYears(cal, sign, from, code, to, count) ==
  IF NonISODateSurpasses(cal, sign, from, code, to, count + sign, 0) THEN count
  ELSE NonISOForeYears(cal, sign, from, code, to, count + sign)
NonISOBackMonths(cal, sign, from, code, to, years, count) ==
  IF count = 0 \/ ~NonISODateSurpasses(cal, sign, from, code, to, years, count) THEN count
  ELSE NonISOBackMonths(cal, sign, from, code, to, years, count - sign)
NonISOForeMonths(cal, sign, from, code, to, years, count) ==
  IF NonISODateSurpasses(cal, sign, from, code, to, years, count + sign) THEN count
  ELSE NonISOForeMonths(cal, sign, from, code, to, years, count + sign)
NonISODateUntil(cal, one, two, largestUnit) ==
  LET sign == -CompareISODate(one, two)
      from == CalendarParts(cal, one)
      to == CalendarParts(cal, two)
      code == ArithmeticMonthCode(cal, from.year, from.month)
      guess(count) == IF sign * count < 0 THEN 0 ELSE count
      years == IF largestUnit = TUYear
               THEN NonISOForeYears(cal, sign, from, code, to, NonISOBackYears(cal, sign, from, code, to, guess(to.year - from.year)))
               ELSE 0
      start == NonISOReached(cal, from, code, years, 0)
      months == IF largestUnit \in {TUYear, TUMonth}
                THEN NonISOForeMonths(cal, sign, from, code, to, years,
                                      NonISOBackMonths(cal, sign, from, code, to, years,
                                                       guess(MonthsBetween(cal, start, to))))
                ELSE 0
      at == NonISOReached(cal, from, code, years, months)
      length == ArithmeticDaysInMonth(cal, at.year, at.month)
      days == RataDie(two) - ArithmeticRataDie(cal, at.year, at.month, IF from.day > length THEN length ELSE from.day)
      weeks == CASE largestUnit # TUWeek -> 0 [] days < 0 -> -((-days) \div 7) [] OTHER -> days \div 7
  IN IF sign = 0 THEN ZeroDateDuration ELSE <<TI(years), TI(months), TI(weeks), TI(days - 7 * weeks)>>
