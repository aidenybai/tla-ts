(*---
description: Evaluates a random set expression, seed 262, number 1376.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01376 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN LET b2195 == ([a |-> 1, b |-> TRUE]).a IN (b2195 + b2195) .. Head(SortSeq(SelectSeq(TRUE, LAMBDA e : e > 0), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01376 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    TRUE
---*)
