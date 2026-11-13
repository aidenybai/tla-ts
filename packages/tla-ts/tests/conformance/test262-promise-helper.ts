// test262's harness/promiseHelper.js, typed so that tla-ts can compile it. Its forEach calls are
// loops, as the arrays that tla-ts holds have no holes for forEach to skip.

// oxlint-disable-next-line no-unused-vars
function checkSequence(arr: unknown[], message?: string) {
  for (let index = 0; index < arr.length; index++) {
    if (arr[index] !== index + 1) {
      throw new Test262Error(
        (message ? message : "Steps in unexpected sequence:") + " '" + arr.join(",") + "'",
      );
    }
  }
  return true;
}

interface ExpectedSettled {
  status: string;
  value?: unknown;
  reason?: unknown;
}

// oxlint-disable-next-line no-unused-vars
function checkSettledPromises(
  settleds: PromiseSettledResult<unknown>[],
  expected: ExpectedSettled[],
  message?: string,
) {
  const prefix = message ? `${message}: ` : "";
  assert.sameValue(Array.isArray(settleds), true, `${prefix}Settled values is an array`);
  assert.sameValue(
    settleds.length,
    expected.length,
    `${prefix}The settled values has a different length than expected`,
  );
  for (let index = 0; index < settleds.length; index++) {
    const settled = settleds[index];
    assert.sameValue(
      Object.prototype.hasOwnProperty.call(settled, "status"),
      true,
      `${prefix}The settled value has a property status`,
    );
    assert.sameValue(settled.status, expected[index].status, `${prefix}status for item ${index}`);
    if (settled.status === "fulfilled") {
      assert.sameValue(
        Object.prototype.hasOwnProperty.call(settled, "value"),
        true,
        `${prefix}The fulfilled promise has a property named value`,
      );
      assert.sameValue(
        Object.prototype.hasOwnProperty.call(settled, "reason"),
        false,
        `${prefix}The fulfilled promise has no property named reason`,
      );
      assert.sameValue(settled.value, expected[index].value, `${prefix}value for item ${index}`);
    } else {
      assert.sameValue(
        settled.status,
        "rejected",
        `${prefix}Valid statuses are only fulfilled or rejected`,
      );
      assert.sameValue(
        Object.prototype.hasOwnProperty.call(settled, "value"),
        false,
        `${prefix}The fulfilled promise has no property named value`,
      );
      assert.sameValue(
        Object.prototype.hasOwnProperty.call(settled, "reason"),
        true,
        `${prefix}The fulfilled promise has a property named reason`,
      );
      assert.sameValue(
        settled.reason,
        expected[index].reason,
        `${prefix}Reason value for item ${index}`,
      );
    }
  }
}
