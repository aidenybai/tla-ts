(*---
description: Evaluates a random seq expression, seed 262, number 8204.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08204 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq(SortSeq([<<1>> EXCEPT ![1] = 2], LAMBDA p, q : p < q), CASE (~TRUE) -> (2147483647 - -1) [] OTHER -> ([a |-> 1]).a, LET b12692 == Head(<<1>>) IN ({1, 2} \subseteq {1, 2}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08204 failed.
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    TRUE
---*)
