(*---
description: funcset_domain applied to cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_domain_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{1, 2} \X {3} -> {9}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(<<1, 3>> :> 9 @@ <<2, 3>> :> 9)}"
---*)
