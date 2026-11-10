(*---
description: funcset_domain applied to set_cup, a SetCupValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_domain_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{1} \cup {2} -> {9}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<9, 9>>}"
---*)
