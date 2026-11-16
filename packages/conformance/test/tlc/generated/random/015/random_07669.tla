(*---
description: Evaluates a random function expression, seed 262, number 7669.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07669 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = (-1 % 3)])[Cardinality((2147483647 .. 1))] :> (({-1 : b11805 \in 1..3} - (CHOOSE b11806 \in <<1, 2>> : FALSE)) \div LET b11807 == Len(<<1, 2>>) IN Head(TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07669 failed.
    Attempted to access index 0 of tuple
    <<2, 1, 2>>
    which is out of bounds.
---*)
