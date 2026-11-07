(*---
description: A nested module sees what the outer module extends.
ref: "tla2sany/semantic/Generator.java#generateModule"
features: [nested]
flags: [expression]
outcome: success
---*)
---- MODULE inner_sees_outer_extends ----
EXTENDS Naturals
---- MODULE I ----
B == 1 + 1
====
INSTANCE I
Test == B = 2
====

(*--- recorded
all:
  exit: 0
---*)
