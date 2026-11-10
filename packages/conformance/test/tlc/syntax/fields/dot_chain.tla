(*---
description: Record selection chains left to right.
ref: tla2sany/parser/Operators.java
features: [fields]
flags: [expression]
outcome: success
---*)
---- MODULE dot_chain ----
Test == [a |-> [b |-> [c |-> 1]]].a.b.c = 1
====

(*--- recorded
all:
  exit: 0
---*)
