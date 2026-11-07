(*---
description: Evaluates a random bool expression, seed 262, number 6435.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06435 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq([a |-> (3 + 3), b |-> (FALSE <=> FALSE)], LAMBDA e : e > 0) = ((~(Nat \subseteq 2..1)) < ((7 * 2) % Head(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 6, b |-> TRUE]
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 6, b |-> TRUE]
---*)
