(*---
description: Level-checks a action-level expression in assume.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_assume__action ----
CONSTANT c
VARIABLE x
ASSUME x'
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 1 to line 11, col 9 of module level_assume__action
    | Level error: assumptions must be level 0 (Constant), 
    | but this one has level 2.
    3002:1 Parsing or semantic analysis failed.
---*)
