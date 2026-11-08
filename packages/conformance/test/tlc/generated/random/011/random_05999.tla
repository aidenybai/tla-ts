(*---
description: Evaluates a random seq expression, seed 262, number 5999.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05999 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(((SelectSeq(<<1, 2>>, LAMBDA e : e > 0) \o Tail(<<3, 1, 2>>)) \o <<(7 % 0), (0 - 0)>>), (Head(SubSeq(<<>>, 3, 2147483647)) \div Cardinality((0 .. 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05999 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
