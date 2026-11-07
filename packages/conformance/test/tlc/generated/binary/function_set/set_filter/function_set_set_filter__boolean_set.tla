(*---
description: function_set of set_filter, a SetPredValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_filter__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({x \in 1..3 : x > 1}) -> (BOOLEAN)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { (2 :> FALSE @@ 3 :> FALSE),
    |   (2 :> FALSE @@ 3 :> TRUE),
    |   (2 :> TRUE @@ 3 :> FALSE),
    |   (2 :> TRUE @@ 3 :> TRUE) }
---*)
