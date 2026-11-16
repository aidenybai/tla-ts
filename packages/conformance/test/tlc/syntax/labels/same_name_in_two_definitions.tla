(*---
description: Each definition has its own label set.
ref: "tla2sany/semantic/Generator.java#generateLabel"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE same_name_in_two_definitions ----
A == l:: TRUE
B == l:: FALSE
Test == A!l /\ ~B!l
====

(*--- recorded
all:
  exit: 0
---*)
