(*---
description: function_set of boolean_set, a SetEnumValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_boolean_set__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(BOOLEAN) -> (SUBSET {1, 2})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { (FALSE :> {} @@ TRUE :> {}),
    |   (FALSE :> {} @@ TRUE :> {1}),
    |   (FALSE :> {} @@ TRUE :> {2}),
    |   (FALSE :> {} @@ TRUE :> {1, 2}),
    |   (FALSE :> {1} @@ TRUE :> {}),
    |   (FALSE :> {1} @@ TRUE :> {1}),
    |   (FALSE :> {1} @@ TRUE :> {2}),
    |   (FALSE :> {1} @@ TRUE :> {1, 2}),
    |   (FALSE :> {2} @@ TRUE :> {}),
    |   (FALSE :> {2} @@ TRUE :> {1}),
    |   (FALSE :> {2} @@ TRUE :> {2}),
    |   (FALSE :> {2} @@ TRUE :> {1, 2}),
    |   (FALSE :> {1, 2} @@ TRUE :> {}),
    |   (FALSE :> {1, 2} @@ TRUE :> {1}),
    |   (FALSE :> {1, 2} @@ TRUE :> {2}),
    |   (FALSE :> {1, 2} @@ TRUE :> {1, 2}) }
---*)
