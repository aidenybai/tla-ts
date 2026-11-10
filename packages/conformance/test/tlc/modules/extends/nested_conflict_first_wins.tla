(*---
description: "Nested siblings merge the same way: the first listed wins."
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
flags: [expression]
outcome: success
---*)
---- MODULE nested_conflict_first_wins ----
---- MODULE A ----
X == 1
====
---- MODULE B ----
X == 2
====
---- MODULE C ----
EXTENDS A, B
====
INSTANCE C
Test == X = 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | *** Warnings: 1
    | line 13, col 1 to line 13, col 6 of module nested_conflict_first_wins
    | Warning: the definition of 'X' conflicts with 
    | its definition at line 10, col 1 to line 10, col 6 of module nested_conflict_first_wins.
---*)
