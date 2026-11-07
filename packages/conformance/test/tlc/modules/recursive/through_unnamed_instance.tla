(*---
description: A recursive operator works through an unnamed instance.
ref: "tla2sany/semantic/Generator.java#generateInstance"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE through_unnamed_instance ----
---- MODULE I ----
EXTENDS Naturals
RECURSIVE F(_)
F(n) == IF n = 0 THEN 0 ELSE F(n - 1)
====
INSTANCE I
Test == F(2) = 0
====

(*--- recorded
all:
  exit: 0
---*)
