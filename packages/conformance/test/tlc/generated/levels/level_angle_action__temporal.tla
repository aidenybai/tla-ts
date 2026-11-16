(*---
description: Level-checks a temporal-level expression in angle_action.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_angle_action__temporal ----
CONSTANT c
VARIABLE x
Op == <><<[](x = 0)>>_x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 9 to line 11, col 23 of module level_angle_action__temporal
    | Level error in applying operator $AngleAct:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
