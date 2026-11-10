(*---
description: Level-checks a temporal-level expression in strong_fairness.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_strong_fairness__temporal ----
CONSTANT c
VARIABLE x
Op == SF_x([](x = 0))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 7 to line 11, col 21 of module level_strong_fairness__temporal
    | Level error in applying operator $SF:
    | The level of argument 2 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
