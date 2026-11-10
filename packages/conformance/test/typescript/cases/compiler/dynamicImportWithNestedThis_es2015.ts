/*---
description: Ported from TypeScript's tests/cases/compiler/dynamicImportWithNestedThis_es2015.ts.
outcome: throws
source: tests/cases/compiler/dynamicImportWithNestedThis_es2015.ts
---*/
// @lib: es2015
// @target: es2015
// @module: umd
// https://github.com/Microsoft/TypeScript/issues/17564
class C {
	private _path = './other';

	dynamic() {
		return import(this._path);
	}
}

const c = new C();
c.dynamic();

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
