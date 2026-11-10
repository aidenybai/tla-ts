(*---
description: A nested module sees definitions that come before it.
ref: "tla2sany/semantic/Generator.java#generateModule"
features: [nested]
flags: [expression]
outcome: success
---*)
---- MODULE inner_sees_outer_definition ----
A == 7
---- MODULE I ----
B == A
====
INSTANCE I
Test == B = 7
====

(*--- recorded
all:
  exit: 0
---*)
