(*---
description: "A record with the same number of different fields is not a member."
ref: "tlc2/value/impl/SetOfRcdsValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_other_field_false ----
EXTENDS Integers
Test == [b |-> 1] \notin [a : {1}]
====

(*--- recorded
all:
  exit: 0
---*)
