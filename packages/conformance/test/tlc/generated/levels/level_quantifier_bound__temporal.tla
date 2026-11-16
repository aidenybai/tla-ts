(*---
description: Level-checks a temporal-level expression in quantifier_bound.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_quantifier_bound__temporal ----
CONSTANT c
VARIABLE x
Op == \E e \in {[](x = 0)} : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 16 to line 11, col 26 of module level_quantifier_bound__temporal
    | Level error in applying operator $SetEnumerate:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
