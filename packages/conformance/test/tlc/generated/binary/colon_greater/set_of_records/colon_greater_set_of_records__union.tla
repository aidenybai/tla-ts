(*---
description: colon_greater of set_of_records, a SetOfRcdsValue, and union, a UnionValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_of_records__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) :> (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({[a |-> 1], [a |-> 2]} :> {1, 2})"
---*)
