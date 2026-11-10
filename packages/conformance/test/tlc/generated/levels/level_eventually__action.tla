(*---
description: Level-checks a action-level expression in eventually.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_eventually__action ----
CONSTANT c
VARIABLE x
Op == <>(x')
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 7 to line 11, col 12 of module level_eventually__action
    | <> followed by action not of form <<A>>_v.
    3002:1 Parsing or semantic analysis failed.
---*)
