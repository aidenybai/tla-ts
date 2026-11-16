(*---
description: Level-checks a temporal-level expression in choose_body.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_choose_body__temporal ----
CONSTANT c
VARIABLE x
Op == CHOOSE e \in {1} : [](x = 0)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 7 to line 11, col 34 of module level_choose_body__temporal
    | Level error in applying operator $BoundedChoose:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
