(*---
description: Level-checks a action-level expression in operator_argument.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_operator_argument__action ----
CONSTANT c
VARIABLE x
F(a) == a'
Op == F(x')
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 7 to line 12, col 11 of module level_operator_argument__action
    | Level error in applying operator F:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
