(*---
description: A record field over Any accepts anything.
ref: tlc2/module/AnySet.java#member
features:
  - AnySet
flags:
  - expression
outcome: success
---*)
---- MODULE record_set_field ----
EXTENDS TLC
Test == [a |-> {1}] \in [a : Any]
====

(*--- recorded
all:
  exit: 0
---*)
