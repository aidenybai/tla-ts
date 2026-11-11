(*---
description: Level-checks a temporal-level expression in enabled.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_enabled__temporal ----
CONSTANT c
VARIABLE x
Op == ENABLED ([](x = 0))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 7 to line 11, col 25 of module level_enabled__temporal
    | Level error in applying operator ENABLED:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
