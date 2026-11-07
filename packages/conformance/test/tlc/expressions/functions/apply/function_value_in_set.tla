(*---
description: "Functions can be elements of sets and keys of other functions."
ref: "tlc2/value/impl/FcnRcdValue.java#select"
flags: [expression]
outcome: success
---*)
---- MODULE function_value_in_set ----
EXTENDS Integers, TLC
F == [g \in {(1 :> 2)} |-> 7]
Test == F[(1 :> 2)] = 7
====

(*--- recorded
all:
  exit: 0
---*)
