(*---
description: append of bag, a FcnRcdValue, and union, a UnionValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_bag__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SetToBag({1}), UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, {1, 2}>>"
---*)
