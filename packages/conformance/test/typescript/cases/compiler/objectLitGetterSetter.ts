/*---
description: Ported from TypeScript's tests/cases/compiler/objectLitGetterSetter.ts.
outcome: success
source: tests/cases/compiler/objectLitGetterSetter.ts
---*/
// @target: es2015
            var obj = {};
            Object.defineProperty(obj, "accProperty", <PropertyDescriptor>({
                get: function () {
                    eval("public = 1;");
                    return 11;
                },
                set: function (v) {
                }
            }))

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
