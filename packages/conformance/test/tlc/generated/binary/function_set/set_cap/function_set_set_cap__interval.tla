(*---
description: function_set of set_cap, a SetCapValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_cap__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({1, 2} \cap {2, 3}) -> (1..3)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(2 :> 1), (2 :> 2), (2 :> 3)}"
---*)
