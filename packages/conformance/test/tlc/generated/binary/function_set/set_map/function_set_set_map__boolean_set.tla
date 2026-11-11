(*---
description: function_set of set_map, a SetEnumValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_map__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({x + 1 : x \in 1..2}) -> (BOOLEAN)])
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
