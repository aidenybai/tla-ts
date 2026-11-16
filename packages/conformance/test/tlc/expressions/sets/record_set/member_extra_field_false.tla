(*---
description: "A record with more fields is not a member."
ref: "tlc2/value/impl/SetOfRcdsValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_extra_field_false ----
EXTENDS Integers
Test == [a |-> 1, b |-> 2] \notin [a : {1}]
====

(*--- recorded
all:
  exit: 0
---*)
