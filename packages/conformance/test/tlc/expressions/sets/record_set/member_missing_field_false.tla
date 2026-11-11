(*---
description: "A record with fewer fields is not a member."
ref: "tlc2/value/impl/SetOfRcdsValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_missing_field_false ----
EXTENDS Integers
Test == [a |-> 1] \notin [a : {1}, b : {2}]
====

(*--- recorded
all:
  exit: 0
---*)
