(*---
description: function_set of set_of_records, a SetOfRcdsValue, and set_filter, a SetPredValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_of_records__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([a : {1, 2}]) -> ({x \in 1..3 : x > 1})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { ([a |-> 1] :> 2 @@ [a |-> 2] :> 2),
    |   ([a |-> 1] :> 2 @@ [a |-> 2] :> 3),
    |   ([a |-> 1] :> 3 @@ [a |-> 2] :> 2),
    |   ([a |-> 1] :> 3 @@ [a |-> 2] :> 3) }
---*)
