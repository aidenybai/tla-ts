(*---
description: Compares colon_greater, a FcnRcdValue, with tuple, a TupleValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_colon_greater__tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) = (<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
