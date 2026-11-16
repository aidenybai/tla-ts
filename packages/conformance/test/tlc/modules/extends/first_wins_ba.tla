(*---
description: Reversing the EXTENDS list reverses which definition wins.
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
flags: [expression]
includes: [FixExtA.tla, FixExtB.tla]
outcome: success
---*)
---- MODULE first_wins_ba ----
EXTENDS FixExtB, FixExtA
Test == Shared = 2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | *** Warnings: 1
    | line 2, col 1 to line 2, col 11 of module FixExtA
    | Warning: the definition of 'Shared' conflicts with 
    | its definition at line 2, col 1 to line 2, col 11 of module FixExtB.
---*)
