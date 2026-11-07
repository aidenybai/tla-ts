(*---
description: colon_greater of int_one, a IntValue, and union, a UnionValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_one__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1) :> (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<{1, 2}>>"
---*)
