(*---
description: function_set of boolean_set, a SetEnumValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_boolean_set__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(BOOLEAN) -> ([a : {1, 2}])])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { (FALSE :> [a |-> 1] @@ TRUE :> [a |-> 1]),
    |   (FALSE :> [a |-> 1] @@ TRUE :> [a |-> 2]),
    |   (FALSE :> [a |-> 2] @@ TRUE :> [a |-> 1]),
    |   (FALSE :> [a |-> 2] @@ TRUE :> [a |-> 2]) }
---*)
