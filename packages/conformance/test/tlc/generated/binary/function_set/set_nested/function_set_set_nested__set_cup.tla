(*---
description: function_set of set_nested, a SetEnumValue, and set_cup, a SetCupValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_nested__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({{1}, {}}) -> ({1} \cup {2})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { ({} :> 1 @@ {1} :> 1),
    |   ({} :> 1 @@ {1} :> 2),
    |   ({} :> 2 @@ {1} :> 1),
    |   ({} :> 2 @@ {1} :> 2) }
---*)
