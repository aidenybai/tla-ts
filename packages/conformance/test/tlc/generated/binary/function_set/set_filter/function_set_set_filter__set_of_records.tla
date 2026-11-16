(*---
description: function_set of set_filter, a SetPredValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_filter__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({x \in 1..3 : x > 1}) -> ([a : {1, 2}])])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { (2 :> [a |-> 1] @@ 3 :> [a |-> 1]),
    |   (2 :> [a |-> 1] @@ 3 :> [a |-> 2]),
    |   (2 :> [a |-> 2] @@ 3 :> [a |-> 1]),
    |   (2 :> [a |-> 2] @@ 3 :> [a |-> 2]) }
---*)
