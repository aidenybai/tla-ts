/*---
description: Ported from TypeScript's tests/cases/compiler/controlFlowForCompoundAssignmentToThisMember.ts.
outcome: success
source: tests/cases/compiler/controlFlowForCompoundAssignmentToThisMember.ts
---*/
// @target: es2015

class DatasourceCommandWidgetElement {
    _commandBased: boolean;
    _commandElement: unknown;
    commandElement: unknown;

    constructor(target: unknown) {
        if (target instanceof DatasourceCommandWidgetElement) {
            this._commandBased = true;
            this._commandElement = target.commandElement;
        } else {
            this._commandBased = false;
        }

        if (this._commandBased = (target instanceof DatasourceCommandWidgetElement)) {
            this._commandElement = target.commandElement;
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
