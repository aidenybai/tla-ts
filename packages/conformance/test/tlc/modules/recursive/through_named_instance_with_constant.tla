(*---
description: A recursive operator through an instance keeps substitutions at every depth.
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE through_named_instance_with_constant ----
---- MODULE I ----
EXTENDS Naturals
CONSTANT k
RECURSIVE F(_)
F(n) == IF n = 0 THEN k ELSE F(n - 1)
====
M == INSTANCE I WITH k <- 7
Test == M!F(2) = 7
====

(*--- recorded
all:
  exit: 0
---*)
