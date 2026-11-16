(*---
description: function_set of set_nested, a SetEnumValue, and set_map, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_nested__set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({{1}, {}}) -> ({x + 1 : x \in 1..2})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { ({} :> 2 @@ {1} :> 2),
    |   ({} :> 2 @@ {1} :> 3),
    |   ({} :> 3 @@ {1} :> 2),
    |   ({} :> 3 @@ {1} :> 3) }
---*)
