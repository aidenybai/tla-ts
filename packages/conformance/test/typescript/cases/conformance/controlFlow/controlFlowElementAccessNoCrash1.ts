/*---
description: Ported from TypeScript's tests/cases/conformance/controlFlow/controlFlowElementAccessNoCrash1.ts.
outcome: success
source: tests/cases/conformance/controlFlow/controlFlowElementAccessNoCrash1.ts
---*/
// @target: es2015
// @strict: true
// @noEmit: true

interface TestTscEdit {
  caption: string;
  commandLineArgs?: readonly string[];
}

interface TestTscCompile {
  subScenario: string;
  commandLineArgs: readonly string[];
}

interface VerifyTscEditDiscrepanciesInput {
  index: number;
  edits: readonly TestTscEdit[];
  commandLineArgs: TestTscCompile["commandLineArgs"];
}

function testTscCompile(input: TestTscCompile) {}

function verifyTscEditDiscrepancies({
  index,
  edits,
  commandLineArgs,
}: VerifyTscEditDiscrepanciesInput) {
  const { caption } = edits[index];
  testTscCompile({
    subScenario: caption,
    commandLineArgs: edits[index].commandLineArgs || commandLineArgs,
  });
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
