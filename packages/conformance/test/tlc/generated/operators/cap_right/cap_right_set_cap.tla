(*---
description: cap_right applied to set_cap, a SetCapValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_right_set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1, 2} \cap {1, 2} \cap {2, 3})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2}"
---*)
