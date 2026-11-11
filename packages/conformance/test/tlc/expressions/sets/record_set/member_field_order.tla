(*---
description: "Field order in the candidate does not matter."
ref: "tlc2/value/impl/SetOfRcdsValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_field_order ----
EXTENDS Integers
Test == [b |-> 2, a |-> 1] \in [a : {1}, b : {2}]
====

(*--- recorded
all:
  exit: 0
---*)
