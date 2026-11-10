(*---
description: Evaluates a random set expression, seed 262, number 7134.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07134 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1] EXCEPT !.a = -1] EXCEPT !.a = @ + Cardinality(1..3)]).a .. Head(SubSeq(<<0, -1>>, LET b10960 == 2 IN -1, (2147483647 % 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07134 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
