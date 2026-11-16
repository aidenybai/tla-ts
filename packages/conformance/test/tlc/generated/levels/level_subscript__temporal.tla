(*---
description: Level-checks a temporal-level expression in subscript.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_subscript__temporal ----
CONSTANT c
VARIABLE x
Op == [][x' = x]_([](x = 0))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 9 to line 11, col 28 of module level_subscript__temporal
    | Level error in applying operator $SquareAct:
    | The level of argument 2 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
