(*---
description: function_set of set_cap, a SetCapValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_cap__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({1, 2} \cap {2, 3}) -> ({1, 2} \X {3})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(2 :> <<1, 3>>), (2 :> <<2, 3>>)}"
---*)
