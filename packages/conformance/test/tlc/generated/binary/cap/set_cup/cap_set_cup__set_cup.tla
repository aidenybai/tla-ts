(*---
description: cap of set_cup, a SetCupValue, and set_cup, a SetCupValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_cup__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1} \cup {2}) \cap ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
