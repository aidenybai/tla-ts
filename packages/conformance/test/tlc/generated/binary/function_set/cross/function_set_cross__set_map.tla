(*---
description: function_set of cross, a SetOfTuplesValue, and set_map, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_cross__set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({1, 2} \X {3}) -> ({x + 1 : x \in 1..2})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { (<<1, 3>> :> 2 @@ <<2, 3>> :> 2),
    |   (<<1, 3>> :> 2 @@ <<2, 3>> :> 3),
    |   (<<1, 3>> :> 3 @@ <<2, 3>> :> 2),
    |   (<<1, 3>> :> 3 @@ <<2, 3>> :> 3) }
---*)
