(*---
description: function_set of set_of_records, a SetOfRcdsValue, and set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_of_records__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([a : {1, 2}]) -> ({{1}, {}})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { ([a |-> 1] :> {} @@ [a |-> 2] :> {}),
    |   ([a |-> 1] :> {} @@ [a |-> 2] :> {1}),
    |   ([a |-> 1] :> {1} @@ [a |-> 2] :> {}),
    |   ([a |-> 1] :> {1} @@ [a |-> 2] :> {1}) }
---*)
