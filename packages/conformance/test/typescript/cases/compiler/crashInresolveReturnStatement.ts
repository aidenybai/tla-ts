/*---
description: Ported from TypeScript's tests/cases/compiler/crashInresolveReturnStatement.ts.
outcome: success
source: tests/cases/compiler/crashInresolveReturnStatement.ts
---*/
// @target: es2015
// @strict: false
class WorkItemToolbar {
    public onToolbarItemClick() {
        WITDialogs.createCopyOfWorkItem();
    }
}
class CreateCopyOfWorkItemDialog {
    public getDialogResult() {
        return null;
    }
}
function createWorkItemDialog<P0>(dialogType: P0) {
}
class WITDialogs {
    public static createCopyOfWorkItem() {
        createWorkItemDialog(CreateCopyOfWorkItemDialog);
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
