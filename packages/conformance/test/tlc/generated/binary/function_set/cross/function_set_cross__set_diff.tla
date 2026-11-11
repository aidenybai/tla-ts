(*---
description: function_set of cross, a SetOfTuplesValue, and set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_cross__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({1, 2} \X {3}) -> ({1, 2} \ {2})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(<<1, 3>> :> 1 @@ <<2, 3>> :> 1)}"
---*)
