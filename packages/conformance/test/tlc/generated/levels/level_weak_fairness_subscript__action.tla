(*---
description: Level-checks a action-level expression in weak_fairness_subscript.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_weak_fairness_subscript__action ----
CONSTANT c
VARIABLE x
Op == WF_(x')(x' = x)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 7 to line 11, col 21 of module level_weak_fairness_subscript__action
    | Level error in applying operator $WF:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
