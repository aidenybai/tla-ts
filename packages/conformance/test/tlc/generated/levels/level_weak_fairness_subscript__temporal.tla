(*---
description: Level-checks a temporal-level expression in weak_fairness_subscript.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_weak_fairness_subscript__temporal ----
CONSTANT c
VARIABLE x
Op == WF_([](x = 0))(x' = x)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 7 to line 11, col 28 of module level_weak_fairness_subscript__temporal
    | Level error in applying operator $WF:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
