(*---
description: Level-checks a action-level expression in leads_to.
ref: tla2sany/semantic/LevelNode.java; Specifying Systems 17.2
features:
  - level-checking
outcome: any
---*)
---- MODULE level_leads_to__action ----
CONSTANT c
VARIABLE x
Op == (x') ~> (x = 0)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 7 to line 11, col 21 of module level_leads_to__action
    | Action used where only temporal formula or state predicate allowed.
    3002:1 Parsing or semantic analysis failed.
---*)
