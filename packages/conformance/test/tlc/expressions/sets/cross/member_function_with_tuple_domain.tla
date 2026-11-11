(*---
description: "A function on 1..2 is a pair and can be a member."
ref: "tlc2/value/impl/SetOfTuplesValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_function_with_tuple_domain ----
EXTENDS Integers
Test == [i \in 1..2 |-> i] \in {1} \X {2}
====

(*--- recorded
all:
  exit: 0
---*)
