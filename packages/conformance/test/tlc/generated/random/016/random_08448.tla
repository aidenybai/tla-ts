(*---
description: Evaluates a random int expression, seed 262, number 8448.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08448 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len([<<Len(<<1, 2>>), (1 \div 0)>> EXCEPT ![1] = Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08448 failed.
    2179:0 The second argument of \div is 0.
---*)
