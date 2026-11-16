(*---
description: Evaluates a random set expression, seed 262, number 3232.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03232 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) :> Head(<<<<5, 6>>, 1>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)
