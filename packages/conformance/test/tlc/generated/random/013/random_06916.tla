(*---
description: Evaluates a random seq expression, seed 262, number 6916.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06916 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Head(Tail(SortSeq(<<1>>, LAMBDA p, q : p < q))), (-IF (\E b10585 \in {1, 2} : FALSE) THEN LET b10586 == 2147483647 IN 2 ELSE Head(<<3, 1, 2>>))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06916 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
