(*---
description: Evaluates a random int expression, seed 262, number 8637.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08637 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Append(SubSeq(<<1, 3>>, Len(<<3, 1, 2>>), [a |-> 2147483647, b |-> TRUE]), IF ({x \in 1..3 : x > 1} = {1}) THEN ([a |-> 1]).a ELSE (2 - 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08637 failed.
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    [a |-> 2147483647, b |-> TRUE]
---*)
