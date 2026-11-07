(*---
description: Evaluates a random seq expression, seed 262, number 1505.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01505 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(LET b2398 == (CHOOSE b2399 \in {} : TRUE) IN Len(<<3, 1, 2>>) % ((-7) - Head(<<>>))), Len((Tail(<<3, 1, 2>>) \o SortSeq(<<1>>, LAMBDA p, q : p < q)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
