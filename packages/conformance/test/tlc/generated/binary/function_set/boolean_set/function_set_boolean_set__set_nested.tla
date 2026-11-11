(*---
description: function_set of boolean_set, a SetEnumValue, and set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_boolean_set__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(BOOLEAN) -> ({{1}, {}})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { (FALSE :> {} @@ TRUE :> {}),
    |   (FALSE :> {} @@ TRUE :> {1}),
    |   (FALSE :> {1} @@ TRUE :> {}),
    |   (FALSE :> {1} @@ TRUE :> {1}) }
---*)
