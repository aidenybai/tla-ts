(*---
description: "A function on strings converts through toRcd and can be a member."
ref: "tlc2/value/impl/SetOfRcdsValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_function_on_strings ----
EXTENDS Integers, TLC
Test == ("a" :> 1) \in [a : {1}] /\ [x \in {"a"} |-> 1] \in [a : {1}]
====

(*--- recorded
all:
  exit: 0
---*)
