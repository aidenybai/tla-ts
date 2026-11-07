(*---
description: Evaluates a random int expression, seed 262, number 7208.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07208 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-(-1 \div 7)) + Head(SubSeq(<<>>, 7, 1))) \div SortSeq(<<LET b11075 == 2147483647 IN b11075, (2 \div 3)>>, LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
