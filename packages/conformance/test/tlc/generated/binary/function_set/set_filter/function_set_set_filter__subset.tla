(*---
description: function_set of set_filter, a SetPredValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_filter__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({x \in 1..3 : x > 1}) -> (SUBSET {1, 2})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { (2 :> {} @@ 3 :> {}),
    |   (2 :> {} @@ 3 :> {1}),
    |   (2 :> {} @@ 3 :> {2}),
    |   (2 :> {} @@ 3 :> {1, 2}),
    |   (2 :> {1} @@ 3 :> {}),
    |   (2 :> {1} @@ 3 :> {1}),
    |   (2 :> {1} @@ 3 :> {2}),
    |   (2 :> {1} @@ 3 :> {1, 2}),
    |   (2 :> {2} @@ 3 :> {}),
    |   (2 :> {2} @@ 3 :> {1}),
    |   (2 :> {2} @@ 3 :> {2}),
    |   (2 :> {2} @@ 3 :> {1, 2}),
    |   (2 :> {1, 2} @@ 3 :> {}),
    |   (2 :> {1, 2} @@ 3 :> {1}),
    |   (2 :> {1, 2} @@ 3 :> {2}),
    |   (2 :> {1, 2} @@ 3 :> {1, 2}) }
---*)
