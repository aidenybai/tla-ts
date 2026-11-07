(*---
description: Evaluates a random seq expression, seed 262, number 2992.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02992 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq((SubSeq([a |-> 1, b |-> TRUE], 3, -1) \o ([x \in Nat |-> x + 1])[-1]), LAMBDA e : e > 0) \o <<([b4752 \in {1} |-> 1..3])[(-1 % 1)], (Head(<<3, 1, 2>>) - LET b4753 == 7 IN b4753)>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
