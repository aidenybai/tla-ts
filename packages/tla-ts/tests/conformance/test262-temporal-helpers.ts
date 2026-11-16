// test262's harness/temporalHelpers.js, typed so that tla-ts can compile it. TemporalHelpers is a
// namespace of the original's methods, so that checkSubclassingIgnored and checkSubclassingIgnoredStatic
// call the checks by name rather than through this. A test calls only some of its functions.
/* oxlint-disable no-unused-vars, typescript/no-explicit-any */

function formatPropertyName(propertyKey: PropertyKey, objectName = "") {
  switch (typeof propertyKey) {
    case "symbol":
      if (Symbol.keyFor(propertyKey) !== undefined) {
        return `${objectName}[Symbol.for('${Symbol.keyFor(propertyKey)}')]`;
      } else if (propertyKey.description!.startsWith("Symbol.")) {
        return `${objectName}[${propertyKey.description}]`;
      } else {
        return `${objectName}[Symbol('${propertyKey.description}')]`;
      }
    case "string":
      if (propertyKey !== String(Number(propertyKey))) {
        if (/^[$_a-zA-Z][$_a-zA-Z0-9]*$/u.test(propertyKey)) {
          return objectName ? `${objectName}.${propertyKey}` : propertyKey;
        }
        return `${objectName}['${propertyKey.replace(/'/g, "\\'")}']`;
      }
    // fall through
    default:
      // integer or string integer-index
      return `${objectName}[${String(propertyKey)}]`;
  }
}

const SKIP_SYMBOL = Symbol("Skip");

// A Temporal class, which a test passes to the checks that construct it.
type TemporalConstructor = new (...args: any[]) => any;

namespace TemporalHelpers {
  // The calendars that have eras, by their codes and possible aliases. tla-ts can't hold an object
  // in a namespace's const, so this function makes the table, and the namespace has neither
  // ISOMonths nor CalendarEras.
  const CALENDARS_WITH_ERAS = [
    "buddhist",
    "coptic",
    "ethiopic",
    "ethioaa",
    "gregory",
    "hebrew",
    "indian",
    "islamic-civil",
    "islamic-tbla",
    "islamic-umalqura",
    "japanese",
    "persian",
    "roc",
  ];

  function getCalendarEras(): { [calendar: string]: { era: string; aliases?: string[] }[] } {
    return {
      buddhist: [{ era: "be" }],
      coptic: [{ era: "am" }],
      ethiopic: [{ era: "aa" }, { era: "am" }],
      ethioaa: [{ era: "aa" }],
      gregory: [
        { era: "bce", aliases: ["bc"] },
        { era: "ce", aliases: ["ad"] },
      ],
      hebrew: [{ era: "am" }],
      indian: [{ era: "shaka" }],
      "islamic-civil": [{ era: "bh" }, { era: "ah" }],
      "islamic-tbla": [{ era: "bh" }, { era: "ah" }],
      "islamic-umalqura": [{ era: "bh" }, { era: "ah" }],
      japanese: [
        { era: "bce", aliases: ["bc"] },
        { era: "ce", aliases: ["ad"] },
        { era: "heisei" },
        { era: "meiji" },
        { era: "reiwa" },
        { era: "showa" },
        { era: "taisho" },
      ],
      persian: [{ era: "ap" }],
      roc: [{ era: "roc" }, { era: "broc" }],
    };
  }

  // Calendars that Apple's fork of ICU has, which AvailableCalendars may not yet support.
  export const NotYetSupportedCalendars = [
    "bangla",
    "gujarati",
    "kannada",
    "marathi",
    "odia",
    "tamil",
    "telugu",
    "vikram",
  ];

  // The canonical era code.
  export function canonicalizeCalendarEra(calendarId: string, eraName: string | undefined) {
    assert.sameValue(
      typeof calendarId,
      "string",
      "calendar must be string in canonicalizeCalendarEra",
    );
    if (!CALENDARS_WITH_ERAS.includes(calendarId)) {
      assert.sameValue(eraName, undefined);
      return undefined;
    }
    assert.sameValue(
      typeof eraName,
      "string",
      "eraName must be string or undefined in canonicalizeCalendarEra",
    );
    for (const { era, aliases = [] } of getCalendarEras()[calendarId]) {
      if (era === eraName || aliases.includes(eraName!)) {
        return era;
      }
    }
    throw new Test262Error(`Unsupported era name: ${eraName}`);
  }

  export function assertDuration(
    duration: Temporal.Duration,
    years: number,
    months: number,
    weeks: number,
    days: number,
    hours: number,
    minutes: number,
    seconds: number,
    milliseconds: number,
    microseconds: number,
    nanoseconds: number,
    description = "",
  ) {
    const prefix = description ? `${description}: ` : "";
    assert(duration instanceof Temporal.Duration, `${prefix}instanceof`);
    assert.sameValue(duration.years, years, `${prefix}years result:`);
    assert.sameValue(duration.months, months, `${prefix}months result:`);
    assert.sameValue(duration.weeks, weeks, `${prefix}weeks result:`);
    assert.sameValue(duration.days, days, `${prefix}days result:`);
    assert.sameValue(duration.hours, hours, `${prefix}hours result:`);
    assert.sameValue(duration.minutes, minutes, `${prefix}minutes result:`);
    assert.sameValue(duration.seconds, seconds, `${prefix}seconds result:`);
    assert.sameValue(duration.milliseconds, milliseconds, `${prefix}milliseconds result:`);
    assert.sameValue(duration.microseconds, microseconds, `${prefix}microseconds result:`);
    assert.sameValue(duration.nanoseconds, nanoseconds, `${prefix}nanoseconds result`);
  }

  export function assertDateDuration(
    duration: Temporal.Duration,
    years: number,
    months: number,
    weeks: number,
    days: number,
    description = "",
  ) {
    const prefix = description ? `${description}: ` : "";
    assert(duration instanceof Temporal.Duration, `${prefix}instanceof`);
    assert.sameValue(duration.years, years, `${prefix}years result:`);
    assert.sameValue(duration.months, months, `${prefix}months result:`);
    assert.sameValue(duration.weeks, weeks, `${prefix}weeks result:`);
    assert.sameValue(duration.days, days, `${prefix}days result:`);
    assert.sameValue(duration.hours, 0, `${prefix}hours result should be zero:`);
    assert.sameValue(duration.minutes, 0, `${prefix}minutes result should be zero:`);
    assert.sameValue(duration.seconds, 0, `${prefix}seconds result should be zero:`);
    assert.sameValue(duration.milliseconds, 0, `${prefix}milliseconds result should be zero:`);
    assert.sameValue(duration.microseconds, 0, `${prefix}microseconds result should be zero:`);
    assert.sameValue(duration.nanoseconds, 0, `${prefix}nanoseconds result should be zero:`);
  }

  export function assertDurationsEqual(
    actual: Temporal.Duration,
    expected: Temporal.Duration,
    description = "",
  ) {
    const prefix = description ? `${description}: ` : "";
    assert(
      expected instanceof Temporal.Duration,
      `${prefix}expected value should be a Temporal.Duration`,
    );
    assertDuration(
      actual,
      expected.years,
      expected.months,
      expected.weeks,
      expected.days,
      expected.hours,
      expected.minutes,
      expected.seconds,
      expected.milliseconds,
      expected.microseconds,
      expected.nanoseconds,
      description,
    );
  }

  export function assertInstantsEqual(
    actual: Temporal.Instant,
    expected: Temporal.Instant,
    description = "",
  ) {
    const prefix = description ? `${description}: ` : "";
    assert(
      expected instanceof Temporal.Instant,
      `${prefix}expected value should be a Temporal.Instant`,
    );
    assert(actual instanceof Temporal.Instant, `${prefix}instanceof`);
    assert(actual.equals(expected), `${prefix}equals method`);
  }

  export function assertPlainDate(
    date: Temporal.PlainDate,
    year: number,
    month: number,
    monthCode: string,
    day: number,
    description = "",
    era: string | undefined = undefined,
    eraYear: number | undefined = undefined,
  ) {
    const prefix = description ? `${description}: ` : "";
    assert(date instanceof Temporal.PlainDate, `${prefix}instanceof`);
    assert.sameValue(
      canonicalizeCalendarEra(date.calendarId, date.era),
      canonicalizeCalendarEra(date.calendarId, era),
      `${prefix}era result:`,
    );
    assert.sameValue(date.eraYear, eraYear, `${prefix}eraYear result:`);
    assert.sameValue(date.year, year, `${prefix}year result:`);
    assert.sameValue(date.month, month, `${prefix}month result:`);
    assert.sameValue(date.monthCode, monthCode, `${prefix}monthCode result:`);
    assert.sameValue(date.day, day, `${prefix}day result:`);
  }

  export function assertPlainDateTime(
    datetime: Temporal.PlainDateTime,
    year: number,
    month: number,
    monthCode: string,
    day: number,
    hour: number,
    minute: number,
    second: number,
    millisecond: number,
    microsecond: number,
    nanosecond: number,
    description = "",
    era: string | undefined = undefined,
    eraYear: number | undefined = undefined,
  ) {
    const prefix = description ? `${description}: ` : "";
    assert(datetime instanceof Temporal.PlainDateTime, `${prefix}instanceof`);
    assert.sameValue(
      canonicalizeCalendarEra(datetime.calendarId, datetime.era),
      canonicalizeCalendarEra(datetime.calendarId, era),
      `${prefix}era result:`,
    );
    assert.sameValue(datetime.eraYear, eraYear, `${prefix}eraYear result:`);
    assert.sameValue(datetime.year, year, `${prefix}year result:`);
    assert.sameValue(datetime.month, month, `${prefix}month result:`);
    assert.sameValue(datetime.monthCode, monthCode, `${prefix}monthCode result:`);
    assert.sameValue(datetime.day, day, `${prefix}day result:`);
    assert.sameValue(datetime.hour, hour, `${prefix}hour result:`);
    assert.sameValue(datetime.minute, minute, `${prefix}minute result:`);
    assert.sameValue(datetime.second, second, `${prefix}second result:`);
    assert.sameValue(datetime.millisecond, millisecond, `${prefix}millisecond result:`);
    assert.sameValue(datetime.microsecond, microsecond, `${prefix}microsecond result:`);
    assert.sameValue(datetime.nanosecond, nanosecond, `${prefix}nanosecond result:`);
  }

  export function assertPlainDatesEqual(
    actual: Temporal.PlainDate,
    expected: Temporal.PlainDate,
    description = "",
  ) {
    const prefix = description ? `${description}: ` : "";
    assert(
      expected instanceof Temporal.PlainDate,
      `${prefix}expected value should be a Temporal.PlainDate`,
    );
    assert(actual instanceof Temporal.PlainDate, `${prefix}instanceof`);
    assert(actual.equals(expected), `${prefix}equals method`);
    assert.sameValue(actual.calendarId, expected.calendarId, `${prefix}calendar same value:`);
  }

  export function assertPlainDateTimesEqual(
    actual: Temporal.PlainDateTime,
    expected: Temporal.PlainDateTime,
    description = "",
  ) {
    const prefix = description ? `${description}: ` : "";
    assert(
      expected instanceof Temporal.PlainDateTime,
      `${prefix}expected value should be a Temporal.PlainDateTime`,
    );
    assert(actual instanceof Temporal.PlainDateTime, `${prefix}instanceof`);
    assert(actual.equals(expected), `${prefix}equals method`);
    assert.sameValue(actual.calendarId, expected.calendarId, `${prefix}calendar same value:`);
  }

  export function assertPlainMonthDay(
    monthDay: Temporal.PlainMonthDay,
    monthCode: string,
    day: number,
    description = "",
    referenceISOYear = 1972,
  ) {
    const prefix = description ? `${description}: ` : "";
    assert(monthDay instanceof Temporal.PlainMonthDay, `${prefix}instanceof`);
    assert.sameValue(monthDay.monthCode, monthCode, `${prefix}monthCode result:`);
    assert.sameValue(monthDay.day, day, `${prefix}day result:`);
    const isoYear = Number(monthDay.toString({ calendarName: "always" }).split("-")[0]);
    assert.sameValue(isoYear, referenceISOYear, `${prefix}referenceISOYear result:`);
  }

  export function assertPlainTime(
    time: Temporal.PlainTime,
    hour: number,
    minute: number,
    second: number,
    millisecond: number,
    microsecond: number,
    nanosecond: number,
    description = "",
  ) {
    const prefix = description ? `${description}: ` : "";
    assert(time instanceof Temporal.PlainTime, `${prefix}instanceof`);
    assert.sameValue(time.hour, hour, `${prefix}hour result:`);
    assert.sameValue(time.minute, minute, `${prefix}minute result:`);
    assert.sameValue(time.second, second, `${prefix}second result:`);
    assert.sameValue(time.millisecond, millisecond, `${prefix}millisecond result:`);
    assert.sameValue(time.microsecond, microsecond, `${prefix}microsecond result:`);
    assert.sameValue(time.nanosecond, nanosecond, `${prefix}nanosecond result:`);
  }

  export function assertPlainTimesEqual(
    actual: Temporal.PlainTime,
    expected: Temporal.PlainTime,
    description = "",
  ) {
    const prefix = description ? `${description}: ` : "";
    assert(
      expected instanceof Temporal.PlainTime,
      `${prefix}expected value should be a Temporal.PlainTime`,
    );
    assert(actual instanceof Temporal.PlainTime, `${prefix}instanceof`);
    assert(actual.equals(expected), `${prefix}equals method`);
  }

  export function assertPlainYearMonth(
    yearMonth: Temporal.PlainYearMonth,
    year: number,
    month: number,
    monthCode: string,
    description = "",
    era: string | undefined = undefined,
    eraYear: number | undefined = undefined,
    referenceISODay: number | null = 1,
  ) {
    const prefix = description ? `${description}: ` : "";
    assert(
      typeof referenceISODay === "number" || referenceISODay === null,
      `TemporalHelpers.assertPlainYearMonth() referenceISODay argument should be a number or null, not ${referenceISODay}`,
    );
    assert(yearMonth instanceof Temporal.PlainYearMonth, `${prefix}instanceof`);
    assert.sameValue(
      canonicalizeCalendarEra(yearMonth.calendarId, yearMonth.era),
      canonicalizeCalendarEra(yearMonth.calendarId, era),
      `${prefix}era result:`,
    );
    assert.sameValue(yearMonth.eraYear, eraYear, `${prefix}eraYear result:`);
    assert.sameValue(yearMonth.year, year, `${prefix}year result:`);
    assert.sameValue(yearMonth.month, month, `${prefix}month result:`);
    assert.sameValue(yearMonth.monthCode, monthCode, `${prefix}monthCode result:`);
    const isoDay = Number(
      yearMonth.toString({ calendarName: "always" }).slice(1).split("-")[2].slice(0, 2),
    );
    const expectedISODay =
      referenceISODay ?? yearMonth.toPlainDate({ day: 1 }).withCalendar("iso8601").day;
    assert.sameValue(isoDay, expectedISODay, `${prefix}referenceISODay result:`);
  }

  export function assertZonedDateTimesEqual(
    actual: Temporal.ZonedDateTime,
    expected: Temporal.ZonedDateTime,
    description = "",
  ) {
    const prefix = description ? `${description}: ` : "";
    assert(
      expected instanceof Temporal.ZonedDateTime,
      `${prefix}expected value should be a Temporal.ZonedDateTime`,
    );
    assert(actual instanceof Temporal.ZonedDateTime, `${prefix}instanceof`);
    assert(actual.equals(expected), `${prefix}equals method`);
    assert.sameValue(actual.timeZoneId, expected.timeZoneId, `${prefix}time zone same value:`);
    assert.sameValue(actual.calendarId, expected.calendarId, `${prefix}calendar same value:`);
  }

  export function assertUnreachable(description?: string): never {
    let message = "This code should not be executed";
    if (description) {
      message = `${message}: ${description}`;
    }
    throw new Test262Error(message);
  }

  // ToTemporalDate and ToTemporalTime read a PlainDateTime's internal slots rather than call its
  // getters.
  export function checkPlainDateTimeConversionFastPath(
    func: (datetime: Temporal.PlainDateTime) => unknown,
    message = "checkPlainDateTimeConversionFastPath",
  ) {
    const actual: string[] = [];
    const expected: string[] = [];
    const calendar = "iso8601";
    const datetime = new Temporal.PlainDateTime(2000, 5, 2, 12, 34, 56, 987, 654, 321, calendar);
    const prototypeDescrs = Object.getOwnPropertyDescriptors(Temporal.PlainDateTime.prototype);
    [
      "year",
      "month",
      "monthCode",
      "day",
      "hour",
      "minute",
      "second",
      "millisecond",
      "microsecond",
      "nanosecond",
    ].forEach((property) => {
      Object.defineProperty(datetime, property, {
        get() {
          actual.push(`get ${formatPropertyName(property)}`);
          const value = prototypeDescrs[property].get!.call(this);
          return {
            toString() {
              actual.push(`toString ${formatPropertyName(property)}`);
              return value.toString();
            },
            valueOf() {
              actual.push(`valueOf ${formatPropertyName(property)}`);
              return value;
            },
          };
        },
      });
    });
    Object.defineProperty(datetime, "calendar", {
      get() {
        actual.push("get calendar");
        return calendar;
      },
    });
    func(datetime);
    assert.compareArray(actual, expected, `${message}: property getters not called`);
  }

  // An options bag accepts each unit in the plural as in the singular.
  export function checkPluralUnitsAccepted(
    func: (unit: any) => unknown,
    validSingularUnits: string[],
  ) {
    const plurals: { [unit: string]: string } = {
      year: "years",
      month: "months",
      week: "weeks",
      day: "days",
      hour: "hours",
      minute: "minutes",
      second: "seconds",
      millisecond: "milliseconds",
      microsecond: "microseconds",
      nanosecond: "nanoseconds",
    };
    validSingularUnits.forEach((unit) => {
      const singularValue = func(unit);
      const pluralValue = func(plurals[unit]);
      const desc = `Plural ${plurals[unit]} produces the same result as singular ${unit}`;
      if (singularValue instanceof Temporal.Duration) {
        assertDurationsEqual(pluralValue as Temporal.Duration, singularValue, desc);
      } else if (singularValue instanceof Temporal.Instant) {
        assertInstantsEqual(pluralValue as Temporal.Instant, singularValue, desc);
      } else if (singularValue instanceof Temporal.PlainDateTime) {
        assertPlainDateTimesEqual(pluralValue as Temporal.PlainDateTime, singularValue, desc);
      } else if (singularValue instanceof Temporal.PlainTime) {
        assertPlainTimesEqual(pluralValue as Temporal.PlainTime, singularValue, desc);
      } else if (singularValue instanceof Temporal.ZonedDateTime) {
        assertZonedDateTimesEqual(pluralValue as Temporal.ZonedDateTime, singularValue, desc);
      } else {
        assert.sameValue(pluralValue, singularValue);
      }
    });
  }

  // The type handling of the roundingIncrement option.
  export function checkRoundingIncrementOptionWrongType(
    checkFunc: (roundingIncrement: any) => unknown,
    assertTrueResultFunc: (result: any, description: string) => void,
    assertObjectResultFunc: (result: any, description: string) => void,
  ) {
    // null converts to 0, which is out of range
    assert.throws(RangeError, () => checkFunc(null), "null");
    // Booleans convert to either 0 or 1, and 1 is allowed
    const trueResult = checkFunc(true);
    assertTrueResultFunc(trueResult, "true");
    assert.throws(RangeError, () => checkFunc(false), "false");
    // Symbols and BigInts cannot convert to numbers
    assert.throws(TypeError, () => checkFunc(Symbol()), "symbol");
    assert.throws(TypeError, () => checkFunc(2n), "bigint");
    // Objects prefer their valueOf() methods when converting to a number
    assert.throws(RangeError, () => checkFunc({}), "plain object");
    const expected = ["get roundingIncrement.valueOf", "call roundingIncrement.valueOf"];
    const actual: string[] = [];
    const observer = toPrimitiveObserver(actual, 2, "roundingIncrement");
    const objectResult = checkFunc(observer);
    assertObjectResultFunc(objectResult, "object with valueOf");
    assert.compareArray(actual, expected, "order of operations");
  }

  // The type handling of a string option.
  export function checkStringOptionWrongType(
    propertyName: string,
    value: unknown,
    checkFunc: (value: any) => unknown,
    assertFunc: (result: any, description: string) => void,
  ) {
    // null converts to the string "null", which is an invalid string value
    assert.throws(RangeError, () => checkFunc(null), "null");
    // Booleans convert to the strings "true" or "false", which are invalid
    assert.throws(RangeError, () => checkFunc(true), "true");
    assert.throws(RangeError, () => checkFunc(false), "false");
    // Symbols cannot convert to strings
    assert.throws(TypeError, () => checkFunc(Symbol()), "symbol");
    // Numbers convert to strings which are invalid
    assert.throws(RangeError, () => checkFunc(2), "number");
    // BigInts convert to strings which are invalid
    assert.throws(RangeError, () => checkFunc(2n), "bigint");
    // Objects prefer their toString() methods when converting to a string
    assert.throws(RangeError, () => checkFunc({}), "plain object");
    const expected = [`get ${propertyName}.toString`, `call ${propertyName}.toString`];
    const actual: string[] = [];
    const observer = toPrimitiveObserver(actual, value, propertyName);
    const result = checkFunc(observer);
    assertFunc(result, "object with toString");
    assert.compareArray(actual, expected, "order of operations");
  }

  // Methods that return a new instance of their class ignore a subclass's constructor and
  // @@species.
  export function checkSubclassingIgnored(
    construct: TemporalConstructor,
    constructArgs: unknown[],
    method: string,
    methodArgs: unknown[],
    resultAssertions: (result: any) => void,
  ) {
    checkSubclassConstructorNotObject(
      construct,
      constructArgs,
      method,
      methodArgs,
      resultAssertions,
    );
    checkSubclassConstructorUndefined(
      construct,
      constructArgs,
      method,
      methodArgs,
      resultAssertions,
    );
    checkSubclassConstructorThrows(construct, constructArgs, method, methodArgs, resultAssertions);
    checkSubclassConstructorNotCalled(
      construct,
      constructArgs,
      method,
      methodArgs,
      resultAssertions,
    );
    checkSubclassSpeciesInvalidResult(
      construct,
      constructArgs,
      method,
      methodArgs,
      resultAssertions,
    );
    checkSubclassSpeciesNotAConstructor(
      construct,
      constructArgs,
      method,
      methodArgs,
      resultAssertions,
    );
    checkSubclassSpeciesNull(construct, constructArgs, method, methodArgs, resultAssertions);
    checkSubclassSpeciesUndefined(construct, constructArgs, method, methodArgs, resultAssertions);
    checkSubclassSpeciesThrows(construct, constructArgs, method, methodArgs, resultAssertions);
  }

  // Replacing the instance's constructor property with a primitive doesn't change the result.
  export function checkSubclassConstructorNotObject(
    construct: TemporalConstructor,
    constructArgs: unknown[],
    method: string,
    methodArgs: unknown[],
    resultAssertions: (result: any) => void,
  ) {
    function check(value: unknown, description: string) {
      const instance = new construct(...constructArgs);
      instance.constructor = value;
      const result = instance[method](...methodArgs);
      assert.sameValue(Object.getPrototypeOf(result), construct.prototype, description);
      resultAssertions(result);
    }
    check(null, "null");
    check(true, "true");
    check("test", "string");
    check(Symbol(), "Symbol");
    check(7, "number");
    check(7n, "bigint");
  }

  // Replacing the subclass's constructor property with undefined doesn't change the result.
  export function checkSubclassConstructorUndefined(
    construct: TemporalConstructor,
    constructArgs: unknown[],
    method: string,
    methodArgs: unknown[],
    resultAssertions: (result: any) => void,
  ) {
    let called = 0;
    class MySubclass extends construct {
      constructor() {
        ++called;
        super(...constructArgs);
      }
    }
    const instance = new MySubclass();
    assert.sameValue(called, 1);
    (MySubclass.prototype as any).constructor = undefined;
    const result = instance[method](...methodArgs);
    assert.sameValue(called, 1);
    assert.sameValue(Object.getPrototypeOf(result), construct.prototype);
    resultAssertions(result);
  }

  // A getter of the subclass's constructor property that throws isn't called.
  export function checkSubclassConstructorThrows(
    construct: TemporalConstructor,
    constructArgs: unknown[],
    method: string,
    methodArgs: unknown[],
    resultAssertions: (result: any) => void,
  ) {
    function CustomError() {}
    class MySubclass extends construct {}
    const instance = new MySubclass(...constructArgs);
    Object.defineProperty(instance, "constructor", {
      get() {
        throw new (CustomError as any)();
      },
    });
    const result = instance[method](...methodArgs);
    assert.sameValue(Object.getPrototypeOf(result), construct.prototype);
    resultAssertions(result);
  }

  // The subclass's constructor isn't called.
  export function checkSubclassConstructorNotCalled(
    construct: TemporalConstructor,
    constructArgs: unknown[],
    method: string,
    methodArgs: unknown[],
    resultAssertions: (result: any) => void,
  ) {
    let called = 0;
    class MySubclass extends construct {
      constructor() {
        ++called;
        super(...constructArgs);
      }
    }
    const instance = new MySubclass();
    assert.sameValue(called, 1);
    const result = instance[method](...methodArgs);
    assert.sameValue(called, 1);
    assert.sameValue(Object.getPrototypeOf(result), construct.prototype);
    resultAssertions(result);
  }

  // A @@species constructor that gives a non-instance isn't called.
  export function checkSubclassSpeciesInvalidResult(
    construct: TemporalConstructor,
    constructArgs: unknown[],
    method: string,
    methodArgs: unknown[],
    resultAssertions: (result: any) => void,
  ) {
    function check(value: unknown, description: string) {
      const instance = new construct(...constructArgs);
      instance.constructor = {
        [Symbol.species]: function () {
          return value;
        },
      };
      const result = instance[method](...methodArgs);
      assert.sameValue(Object.getPrototypeOf(result), construct.prototype, description);
      resultAssertions(result);
    }
    check(undefined, "undefined");
    check(null, "null");
    check(true, "true");
    check("test", "string");
    check(Symbol(), "Symbol");
    check(7, "number");
    check(7n, "bigint");
    check({}, "plain object");
  }

  // A @@species that isn't a constructor doesn't change the result.
  export function checkSubclassSpeciesNotAConstructor(
    construct: TemporalConstructor,
    constructArgs: unknown[],
    method: string,
    methodArgs: unknown[],
    resultAssertions: (result: any) => void,
  ) {
    function check(value: unknown, description: string) {
      const instance = new construct(...constructArgs);
      instance.constructor = {
        [Symbol.species]: value,
      };
      const result = instance[method](...methodArgs);
      assert.sameValue(Object.getPrototypeOf(result), construct.prototype, description);
      resultAssertions(result);
    }
    check(true, "true");
    check("test", "string");
    check(Symbol(), "Symbol");
    check(7, "number");
    check(7n, "bigint");
    check({}, "plain object");
  }

  // A @@species of null doesn't change the result.
  export function checkSubclassSpeciesNull(
    construct: TemporalConstructor,
    constructArgs: unknown[],
    method: string,
    methodArgs: unknown[],
    resultAssertions: (result: any) => void,
  ) {
    let called = 0;
    class MySubclass extends construct {
      constructor() {
        ++called;
        super(...constructArgs);
      }
    }
    const instance = new MySubclass();
    assert.sameValue(called, 1);
    (MySubclass as any)[Symbol.species] = null;
    const result = instance[method](...methodArgs);
    assert.sameValue(called, 1);
    assert.sameValue(Object.getPrototypeOf(result), construct.prototype);
    resultAssertions(result);
  }

  // A @@species of undefined doesn't change the result.
  export function checkSubclassSpeciesUndefined(
    construct: TemporalConstructor,
    constructArgs: unknown[],
    method: string,
    methodArgs: unknown[],
    resultAssertions: (result: any) => void,
  ) {
    let called = 0;
    class MySubclass extends construct {
      constructor() {
        ++called;
        super(...constructArgs);
      }
    }
    const instance = new MySubclass();
    assert.sameValue(called, 1);
    (MySubclass as any)[Symbol.species] = undefined;
    const result = instance[method](...methodArgs);
    assert.sameValue(called, 1);
    assert.sameValue(Object.getPrototypeOf(result), construct.prototype);
    resultAssertions(result);
  }

  // A getter of @@species that throws isn't called.
  export function checkSubclassSpeciesThrows(
    construct: TemporalConstructor,
    constructArgs: unknown[],
    method: string,
    methodArgs: unknown[],
    resultAssertions: (result: any) => void,
  ) {
    function CustomError() {}
    class MySubclass extends construct {
      constructor(...args: unknown[]) {
        super(...args);
      }
    }
    const instance = new MySubclass(...constructArgs);
    Object.defineProperty(MySubclass, Symbol.species, {
      get() {
        throw new (CustomError as any)();
      },
    });
    const result = instance[method](...methodArgs);
    assert.sameValue(Object.getPrototypeOf(result), construct.prototype);
    resultAssertions(result);
  }

  // Static methods ignore their receiver as checkSubclassingIgnored's checks do.
  export function checkSubclassingIgnoredStatic(
    construct: TemporalConstructor,
    method: string,
    methodArgs: unknown[],
    resultAssertions: (result: any) => void,
  ) {
    checkStaticInvalidReceiver(construct, method, methodArgs, resultAssertions);
    checkStaticReceiverNotCalled(construct, method, methodArgs, resultAssertions);
    checkThisValueNotCalled(construct, method, methodArgs, resultAssertions);
  }

  // A static method called with a receiver that isn't callable still calls the intrinsic
  // constructor.
  export function checkStaticInvalidReceiver(
    construct: TemporalConstructor,
    method: string,
    methodArgs: unknown[],
    resultAssertions: (result: any) => void,
  ) {
    function check(value: unknown, description: string) {
      const result = (construct as any)[method].apply(value, methodArgs);
      assert.sameValue(Object.getPrototypeOf(result), construct.prototype);
      resultAssertions(result);
    }
    check(undefined, "undefined");
    check(null, "null");
    check(true, "true");
    check("test", "string");
    check(Symbol(), "symbol");
    check(7, "number");
    check(7n, "bigint");
    check({}, "Non-callable object");
  }

  // A static method called with a receiver that gives a value that isn't callable still calls the
  // intrinsic constructor.
  export function checkStaticReceiverNotCalled(
    construct: TemporalConstructor,
    method: string,
    methodArgs: unknown[],
    resultAssertions: (result: any) => void,
  ) {
    function check(value: unknown, description: string) {
      const receiver = function () {
        return value;
      };
      const result = (construct as any)[method].apply(receiver, methodArgs);
      assert.sameValue(Object.getPrototypeOf(result), construct.prototype);
      resultAssertions(result);
    }
    check(undefined, "undefined");
    check(null, "null");
    check(true, "true");
    check("test", "string");
    check(Symbol(), "symbol");
    check(7, "number");
    check(7n, "bigint");
    check({}, "Non-callable object");
  }

  // A static method doesn't call its receiver.
  export function checkThisValueNotCalled(
    construct: TemporalConstructor,
    method: string,
    methodArgs: unknown[],
    resultAssertions: (result: any) => void,
  ) {
    let called = false;
    class MySubclass extends construct {
      constructor(...args: unknown[]) {
        called = true;
        super(...args);
      }
    }
    const result = (MySubclass as any)[method](...methodArgs);
    assert.sameValue(called, false);
    assert.sameValue(Object.getPrototypeOf(result), construct.prototype);
    resultAssertions(result);
  }

  // ToTemporalCalendar reads a calendar-carrying object's [[Calendar]] slot rather than its
  // getters.
  export function checkToTemporalCalendarFastPath(func: (temporalObject: any) => unknown) {
    const plainDate = new Temporal.PlainDate(2000, 5, 2, "iso8601");
    const plainDateTime = new Temporal.PlainDateTime(
      2000,
      5,
      2,
      12,
      34,
      56,
      987,
      654,
      321,
      "iso8601",
    );
    const plainMonthDay = new Temporal.PlainMonthDay(5, 2, "iso8601");
    const plainYearMonth = new Temporal.PlainYearMonth(2000, 5, "iso8601");
    const zonedDateTime = new Temporal.ZonedDateTime(1_000_000_000_000_000_000n, "UTC", "iso8601");
    [plainDate, plainDateTime, plainMonthDay, plainYearMonth, zonedDateTime].forEach(
      (temporalObject) => {
        Object.defineProperty(temporalObject, "calendar", {
          get() {
            throw new Test262Error("should not get 'calendar' property");
          },
        });
        Object.defineProperty(temporalObject, "calendarId", {
          get() {
            throw new Test262Error("should not get 'calendarId' property");
          },
        });
        func(temporalObject);
      },
    );
  }

  export function checkToTemporalInstantFastPath(
    func: (datetime: Temporal.ZonedDateTime) => unknown,
  ) {
    const actual: string[] = [];
    const expected: string[] = [];
    const datetime = new Temporal.ZonedDateTime(1_000_000_000_987_654_321n, "UTC");
    Object.defineProperty(datetime, "toString", {
      get() {
        actual.push("get toString");
        return function (this: Temporal.ZonedDateTime, options: any) {
          actual.push("call toString");
          return Temporal.ZonedDateTime.prototype.toString.call(this, options);
        };
      },
    });
    func(datetime);
    assert.compareArray(actual, expected, "toString not called");
  }

  export function checkToTemporalPlainDateTimeFastPath(
    func: (date: Temporal.PlainDate) => unknown,
  ) {
    const actual: string[] = [];
    const expected: string[] = [];
    const date = new Temporal.PlainDate(2000, 5, 2, "iso8601");
    const prototypeDescrs = Object.getOwnPropertyDescriptors(Temporal.PlainDate.prototype);
    ["year", "month", "monthCode", "day"].forEach((property) => {
      Object.defineProperty(date, property, {
        get() {
          actual.push(`get ${formatPropertyName(property)}`);
          const value = prototypeDescrs[property].get!.call(this);
          return toPrimitiveObserver(actual, value, property);
        },
      });
    });
    ["hour", "minute", "second", "millisecond", "microsecond", "nanosecond"].forEach((property) => {
      Object.defineProperty(date, property, {
        get() {
          actual.push(`get ${formatPropertyName(property)}`);
          return undefined;
        },
      });
    });
    Object.defineProperty(date, "calendar", {
      get() {
        actual.push("get calendar");
        return "iso8601";
      },
    });
    func(date);
    assert.compareArray(actual, expected, "property getters not called");
  }

  // Defines an own property whose accessors log each call to calls.
  export function observeProperty(
    calls: string[],
    object: object,
    propertyName: PropertyKey,
    value: unknown,
    objectName = "",
  ) {
    Object.defineProperty(object, propertyName, {
      get() {
        calls.push(`get ${formatPropertyName(propertyName, objectName)}`);
        return value;
      },
      set() {
        calls.push(`set ${formatPropertyName(propertyName, objectName)}`);
      },
    });
  }

  // Replaces a method with one that logs each call to calls.
  export function observeMethod(
    calls: string[],
    object: any,
    propertyName: PropertyKey,
    objectName = "",
  ) {
    const method = object[propertyName];
    object[propertyName] = function (...args: unknown[]) {
      calls.push(`call ${formatPropertyName(propertyName, objectName)}`);
      return method.apply(object, args);
    };
  }

  // Marks a substituteMethod value that leaves the call to the method.
  export const SUBSTITUTE_SKIP = SKIP_SYMBOL;

  // Replaces a method with one that gives each of values in turn, and calls the method once they
  // run out or where a value is SUBSTITUTE_SKIP.
  export function substituteMethod(object: any, propertyName: PropertyKey, values: unknown[]) {
    let calls = 0;
    const method = object[propertyName];
    object[propertyName] = function (...args: unknown[]) {
      if (calls >= values.length) {
        return method.apply(object, args);
      } else if (values[calls] === SKIP_SYMBOL) {
        calls++;
        return method.apply(object, args);
      } else {
        return values[calls++];
      }
    };
  }

  // A proxy of a property bag that logs each Get and Has of its properties to calls, and gives
  // each primitive through a toPrimitiveObserver, but those of skipToPrimitive's keys.
  export function propertyBagObserver(
    calls: string[],
    propertyBag: object,
    objectName: string,
    skipToPrimitive?: PropertyKey[],
  ): any {
    return new Proxy(propertyBag, {
      ownKeys(target) {
        calls.push(`ownKeys ${objectName}`);
        return Reflect.ownKeys(target);
      },
      getOwnPropertyDescriptor(target, key) {
        calls.push(`getOwnPropertyDescriptor ${formatPropertyName(key, objectName)}`);
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
      get(target, key, receiver) {
        calls.push(`get ${formatPropertyName(key, objectName)}`);
        const result = Reflect.get(target, key, receiver);
        if (result === undefined) {
          return undefined;
        }
        if ((result !== null && typeof result === "object") || typeof result === "function") {
          return result;
        }
        if (skipToPrimitive && skipToPrimitive.indexOf(key) >= 0) {
          return result;
        }
        return toPrimitiveObserver(calls, result, `${formatPropertyName(key, objectName)}`);
      },
      has(target, key) {
        calls.push(`has ${formatPropertyName(key, objectName)}`);
        return Reflect.has(target, key);
      },
    });
  }

  // An object whose valueOf and toString getters, and the functions they give, log each Get and
  // Call to calls, and give primitiveValue.
  export function toPrimitiveObserver(
    calls: string[],
    primitiveValue: unknown,
    propertyName: string,
  ): any {
    return {
      get valueOf() {
        calls.push(`get ${propertyName}.valueOf`);
        return function () {
          calls.push(`call ${propertyName}.valueOf`);
          return primitiveValue;
        };
      },
      get toString() {
        calls.push(`get ${propertyName}.toString`);
        return function () {
          calls.push(`call ${propertyName}.toString`);
          if (primitiveValue === undefined) return undefined;
          return (primitiveValue as { toString(): string }).toString();
        };
      },
    };
  }

  // Arrays of ISO strings for testing parsers.
  export namespace ISO {
    // PlainMonthDay strings that are not valid.
    export function plainMonthDayStringsInvalid() {
      return [
        "11-18junk",
        "11-18[u-ca=gregory]",
        "11-18[u-ca=hebrew]",
        "11-18[U-CA=iso8601]",
        "11-18[u-CA=iso8601]",
        "11-18[FOO=bar]",
        "-999999-01-01[u-ca=gregory]",
        "-999999-01-01[u-ca=chinese]",
        "+999999-01-01[u-ca=gregory]",
        "+999999-01-01[u-ca=chinese]",
      ];
    }

    // PlainMonthDay strings that are valid and that should produce October 1st.
    export function plainMonthDayStringsValid() {
      return [
        "10-01",
        "1001",
        "1965-10-01",
        "1976-10-01T152330.1+00:00",
        "19761001T15:23:30.1+00:00",
        "1976-10-01T15:23:30.1+0000",
        "1976-10-01T152330.1+0000",
        "19761001T15:23:30.1+0000",
        "19761001T152330.1+00:00",
        "19761001T152330.1+0000",
        "+001976-10-01T152330.1+00:00",
        "+0019761001T15:23:30.1+00:00",
        "+001976-10-01T15:23:30.1+0000",
        "+001976-10-01T152330.1+0000",
        "+0019761001T15:23:30.1+0000",
        "+0019761001T152330.1+00:00",
        "+0019761001T152330.1+0000",
        "1976-10-01T15:23:00",
        "1976-10-01T15:23",
        "1976-10-01T15",
        "1976-10-01",
        "--10-01",
        "--1001",
        "-999999-10-01",
        "-999999-10-01[u-ca=iso8601]",
        "+999999-10-01",
        "+999999-10-01[u-ca=iso8601]",
      ];
    }

    // PlainTime strings that may be mistaken for PlainMonthDay or PlainYearMonth strings, and so
    // require a time designator.
    export function plainTimeStringsAmbiguous() {
      const ambiguousStrings = [
        "2021-12", // ambiguity between YYYY-MM and HHMM-UU
        "2021-12[-12:00]", // ditto, TZ does not disambiguate
        "1214", // ambiguity between MMDD and HHMM
        "0229", //   ditto, including MMDD that doesn't occur every year
        "1130", //   ditto, including DD that doesn't occur in every month
        "12-14", // ambiguity between MM-DD and HH-UU
        "12-14[-14:00]", // ditto, TZ does not disambiguate
        "202112", // ambiguity between YYYYMM and HHMMSS
        "202112[UTC]", // ditto, TZ does not disambiguate
      ];
      // Adding a calendar annotation to one of these strings must not cause disambiguation in
      // favour of time.
      const stringsWithCalendar = ambiguousStrings.map((s) => s + "[u-ca=iso8601]");
      return ambiguousStrings.concat(stringsWithCalendar);
    }

    // PlainTime strings that are of similar form to PlainMonthDay and PlainYearMonth strings, but
    // are not ambiguous due to components that aren't valid as months or days.
    export function plainTimeStringsUnambiguous() {
      return [
        "2021-13", // 13 is not a month
        "202113", //   ditto
        "2021-13[-13:00]", //   ditto
        "202113[-13:00]", //   ditto
        "0000-00", // 0 is not a month
        "000000", //   ditto
        "0000-00[UTC]", //   ditto
        "000000[UTC]", //   ditto
        "1314", // 13 is not a month
        "13-14", //   ditto
        "1232", // 32 is not a day
        "0230", // 30 is not a day in February
        "0631", // 31 is not a day in June
        "0000", // 0 is neither a month nor a day
        "00-00", //   ditto
      ];
    }

    // PlainYearMonth-like strings that are not valid.
    export function plainYearMonthStringsInvalid() {
      return [
        "2020-13",
        "1976-11[u-ca=gregory]",
        "1976-11[u-ca=hebrew]",
        "1976-11[U-CA=iso8601]",
        "1976-11[u-CA=iso8601]",
        "1976-11[FOO=bar]",
        "+999999-01",
        "-999999-01",
      ];
    }

    // PlainYearMonth-like strings that are valid and should produce November 1976 in the ISO 8601
    // calendar.
    export function plainYearMonthStringsValid() {
      return [
        "1976-11",
        "1976-11-10",
        "1976-11-01T09:00:00+00:00",
        "1976-11-01T00:00:00+05:00",
        "197611",
        "+00197611",
        "1976-11-18T15:23:30.1-02:00",
        "1976-11-18T152330.1+00:00",
        "19761118T15:23:30.1+00:00",
        "1976-11-18T15:23:30.1+0000",
        "1976-11-18T152330.1+0000",
        "19761118T15:23:30.1+0000",
        "19761118T152330.1+00:00",
        "19761118T152330.1+0000",
        "+001976-11-18T152330.1+00:00",
        "+0019761118T15:23:30.1+00:00",
        "+001976-11-18T15:23:30.1+0000",
        "+001976-11-18T152330.1+0000",
        "+0019761118T15:23:30.1+0000",
        "+0019761118T152330.1+00:00",
        "+0019761118T152330.1+0000",
        "1976-11-18T15:23",
        "1976-11-18T15",
        "1976-11-18",
      ];
    }

    // PlainYearMonth-like strings that are valid and should produce November of the ISO year
    // -9999.
    export function plainYearMonthStringsValidNegativeYear() {
      return ["-009999-11"];
    }
  }
}
