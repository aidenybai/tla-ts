(*---
description: Level-checks a temporal-level expression in operator_argument.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_operator_argument__temporal ----
CONSTANT c
VARIABLE x
F(a) == a'
Op == F([](x = 0))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 7 to line 12, col 18 of module level_operator_argument__temporal
    | Level error in applying operator F:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
