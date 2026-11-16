(*---
description: Evaluates a random int expression, seed 262, number 3541.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03541 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ([a |-> ((1 :> 2))[1], b |-> (TRUE \/ <<3, 1, 2>>)] < ((7 \div 7) + (0 - 2))) THEN (((2 :> 0))[(7 + 2)] * (Len({1, 2}) - Head(<<1, 2>>))) ELSE Len((SubSeq(<<3, 1, 2>>, 3, -1) \o (<<1>> \o <<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03541 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> 2, b |-> TRUE]
---*)
