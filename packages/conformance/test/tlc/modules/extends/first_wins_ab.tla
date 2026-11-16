(*---
description: "When two extended modules define one name with the same arity, the first in the list wins and only a warning is printed."
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
flags: [expression]
includes: [FixExtA.tla, FixExtB.tla]
outcome: success
---*)
---- MODULE first_wins_ab ----
EXTENDS FixExtA, FixExtB
Test == Shared = 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | *** Warnings: 1
    | line 2, col 1 to line 2, col 11 of module FixExtB
    | Warning: the definition of 'Shared' conflicts with 
    | its definition at line 2, col 1 to line 2, col 11 of module FixExtA.
---*)
