(*---
description: Evaluates a random set expression, seed 262, number 9512.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09512 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SelectSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), LAMBDA e : e > 0)) .. Cardinality(DOMAIN [b14771 \in 1..3 |-> -1])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1..3"
---*)
