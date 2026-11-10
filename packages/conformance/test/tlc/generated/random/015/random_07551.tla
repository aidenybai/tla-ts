(*---
description: Evaluates a random seq expression, seed 262, number 7551.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07551 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SortSeq(SubSeq(Append(<<1>>, 2147483647), (0 + 2147483647), ([a |-> 1, b |-> TRUE]).a), LAMBDA p, q : p < q), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
