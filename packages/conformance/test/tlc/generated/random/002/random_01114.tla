(*---
description: Evaluates a random set expression, seed 262, number 1114.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01114 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({Len(-1), LET b1778 == 1 IN b1778} \ UNION {{3, TRUE}, ({x \in 1..3 : x > 1} \cap 2..1)}) \ ((({1, 2} \cap [a |-> 1, b |-> TRUE]) \cap (SUBSET {1} \cap <<5, 6>>)) \cap (SubSeq(<<3, 1, 2>>, 1, -1) = (FALSE => FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01114 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    -1
---*)
