(*---
description: Level-checks a temporal-level expression in set_element.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_set_element__temporal ----
CONSTANT c
VARIABLE x
Op == {[](x = 0)}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 7 to line 11, col 17 of module level_set_element__temporal
    | Level error in applying operator $SetEnumerate:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
