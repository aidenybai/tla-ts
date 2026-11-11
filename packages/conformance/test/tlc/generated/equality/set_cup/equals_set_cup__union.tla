(*---
description: Compares set_cup, a SetCupValue, with union, a UnionValue.
ref: tlc2/value/impl/SetCupValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_cup__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1} \cup {2}) = (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
