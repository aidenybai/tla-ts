(*---
description: append_value applied to union, a UnionValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_value_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1>>, UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, {1, 2}>>"
---*)
