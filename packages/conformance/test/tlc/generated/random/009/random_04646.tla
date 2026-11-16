(*---
description: Evaluates a random int expression, seed 262, number 4646.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04646 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b7272 \in [x \in Nat |-> x + 1] : FALSE) - (-1 - -1)) - ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] % IF FALSE THEN -1 ELSE 0)) - Len(SubSeq(LET b7273 == 2 IN 3, (2147483647 \div 2147483647), (2147483647 - -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04646 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 20 to line 14, col 65 of module random_04646
---*)
