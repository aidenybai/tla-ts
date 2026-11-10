/*---
description: Ported from TypeScript's tests/cases/compiler/privatePropertyInUnion.ts.
outcome: success
source: tests/cases/compiler/privatePropertyInUnion.ts
---*/
// @target: es2015
// @strict: true

// Repro from #38236

type Type = string | object;

class SyncableObject {
  private foo: unknown;
}

interface SyncableRef<T extends ISyncableObject> {}

interface ISyncableObject<T = object> extends SyncableObject {}

type __ValueDescriptorType<T extends string | object> = T extends ISyncableObject ? SyncableRef<T> : T;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
