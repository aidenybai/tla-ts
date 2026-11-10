/*---
description: Ported from TypeScript's tests/cases/compiler/genericBaseClassLiteralProperty2.ts.
outcome: success
source: tests/cases/compiler/genericBaseClassLiteralProperty2.ts
---*/
// @target: es2015
class CollectionItem2 { }

class BaseCollection2<TItem extends CollectionItem2> {
    _itemsByKey: { [key: string]: TItem; };
    constructor() {
        this._itemsByKey = {};
    }
}

class DataView2 extends BaseCollection2<CollectionItem2> {
    fillItems(item: CollectionItem2) {
        this._itemsByKey['dummy'] = item;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
