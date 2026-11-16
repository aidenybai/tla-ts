(*---
description: Names from every extended module are visible.
ref: "tla2sany/semantic/Generator.java#processExtendsList"
features: [extends]
flags: [expression]
includes: [FixExtA.tla, FixExtB.tla]
outcome: success
---*)
---- MODULE both_non_conflicting_visible ----
EXTENDS FixExtA, FixExtB
Test == OnlyA = 10 /\ OnlyB = 20
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
