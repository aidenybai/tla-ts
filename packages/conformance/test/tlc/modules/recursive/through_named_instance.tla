(*---
description: A recursive operator works through a named instance.
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE through_named_instance ----
---- MODULE I ----
EXTENDS Naturals
RECURSIVE F(_)
F(n) == IF n = 0 THEN 0 ELSE F(n - 1)
====
M == INSTANCE I
Test == M!F(2) = 0
====

(*--- recorded
all:
  exit: 0
---*)
