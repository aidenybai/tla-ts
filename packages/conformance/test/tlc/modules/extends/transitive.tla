(*---
description: Names extended by an extended module are visible.
ref: "tla2sany/semantic/Generator.java#processExtendsList"
features: [extends]
flags: [expression]
includes: [FixExtA.tla, FixExtC.tla]
outcome: success
---*)
---- MODULE transitive ----
EXTENDS FixExtC
Test == OnlyA = 10 /\ OnlyC = 11
====

(*--- recorded
all:
  exit: 0
---*)
