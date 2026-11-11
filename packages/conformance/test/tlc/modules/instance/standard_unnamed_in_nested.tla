(*---
description: A nested module may pull a standard module with INSTANCE instead of EXTENDS.
ref: "tla2sany/semantic/Generator.java#generateInstance"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE standard_unnamed_in_nested ----
---- MODULE I ----
INSTANCE Naturals
A == 1 + 1
====
M == INSTANCE I
Test == M!A = 2
====

(*--- recorded
all:
  exit: 0
---*)
