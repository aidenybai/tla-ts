(*---
description: Evaluates a random set expression, seed 262, number 9841.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09841 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SubSeq(Tail(<<1, 2>>), (0 * 2147483647), (2 % -1))) .. (CHOOSE b15281 \in (([x \in 1..2 |-> x] % 7) \ {2147483647, 2}) : ((b15281 /\ TRUE) <=> ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09841 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
