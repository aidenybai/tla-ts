(*---
description: Evaluates a random int expression, seed 262, number 864.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00864 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b1399 == (-Cardinality((7 :> <<1>>))) IN Head([SelectSeq(<<1>>, LAMBDA e : e > 0) EXCEPT ![1] = (-1)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
