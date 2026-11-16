(*---
description: Evaluates a random bool expression, seed 262, number 5860.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05860 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([SubSeq((2 + 0), (-1), (2 * 0)) EXCEPT ![1] = Head(Tail(<<>>))] = (((SUBSET {1} \cup {2, 1, 3}) \cap ({x \in 1..3 : x > 1} \cup 1..3)) \cap ((2147483647 - 0) .. (<<5, 6>>)[0]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05860 failed.
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    2
---*)
