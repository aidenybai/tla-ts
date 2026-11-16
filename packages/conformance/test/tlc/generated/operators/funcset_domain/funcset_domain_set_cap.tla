(*---
description: funcset_domain applied to set_cap, a SetCapValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_domain_set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{1, 2} \cap {2, 3} -> {9}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(2 :> 9)}"
---*)
