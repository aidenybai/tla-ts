(*---
description: A recursive operator works through EXTENDS.
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE through_extends ----
---- MODULE I ----
EXTENDS Naturals
RECURSIVE F(_)
F(n) == IF n = 0 THEN 0 ELSE F(n - 1)
====
---- MODULE J ----
EXTENDS I
A == F(2)
====
INSTANCE J
Test == A = 0
====

(*--- recorded
all:
  exit: 0
---*)
