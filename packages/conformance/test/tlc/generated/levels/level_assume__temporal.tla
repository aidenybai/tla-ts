(*---
description: Level-checks a temporal-level expression in assume.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_assume__temporal ----
CONSTANT c
VARIABLE x
ASSUME [](x = 0)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 1 to line 11, col 16 of module level_assume__temporal
    | Level error: assumptions must be level 0 (Constant), 
    | but this one has level 3.
    3002:1 Parsing or semantic analysis failed.
---*)
