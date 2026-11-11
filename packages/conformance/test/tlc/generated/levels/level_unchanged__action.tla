(*---
description: Level-checks a action-level expression in unchanged.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_unchanged__action ----
CONSTANT c
VARIABLE x
Op == UNCHANGED (x')
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 7 to line 11, col 20 of module level_unchanged__action
    | Level error in applying operator UNCHANGED:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
