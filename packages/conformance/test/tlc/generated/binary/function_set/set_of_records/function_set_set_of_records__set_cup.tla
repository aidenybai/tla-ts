(*---
description: function_set of set_of_records, a SetOfRcdsValue, and set_cup, a SetCupValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_of_records__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([a : {1, 2}]) -> ({1} \cup {2})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { ([a |-> 1] :> 1 @@ [a |-> 2] :> 1),
    |   ([a |-> 1] :> 1 @@ [a |-> 2] :> 2),
    |   ([a |-> 1] :> 2 @@ [a |-> 2] :> 1),
    |   ([a |-> 1] :> 2 @@ [a |-> 2] :> 2) }
---*)
