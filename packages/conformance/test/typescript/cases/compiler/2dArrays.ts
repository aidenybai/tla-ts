/*---
description: Ported from TypeScript's tests/cases/compiler/2dArrays.ts.
outcome: success
source: tests/cases/compiler/2dArrays.ts
---*/
// @target: es2015
class Cell {
}

class Ship {
    isSunk: boolean = false;
}

class Board {
    ships: Ship[] = [];
    cells: Cell[] = [];

    private allShipsSunk() {
        return this.ships.every(function (val) { return val.isSunk; });
    }    
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
