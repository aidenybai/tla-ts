(*---
description: Two nested modules may share a name when their parents differ.
ref: "tla2sany/semantic/Generator.java#generateModule"
features: [nested]
flags: [expression]
outcome: success
---*)
---- MODULE same_name_in_different_parents ----
---- MODULE P ----
---- MODULE Same ----
A == 1
====
B == INSTANCE Same
====
---- MODULE Q ----
---- MODULE Same ----
A == 2
====
B == INSTANCE Same
====
P1 == INSTANCE P
Q1 == INSTANCE Q
Test == P1!B!A = 1 /\ Q1!B!A = 2
====

(*--- recorded
all:
  exit: 0
---*)
