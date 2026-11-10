(*---
description: Evaluates a random int expression, seed 262, number 3738.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03738 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-[a |-> Head(<<>>), b |-> (-1 \div 0)]) \div Head(SubSeq(SubSeq(<<>>, 3, 0), Len(<<1>>), LET b5902 == 3 IN b5902))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03738 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
