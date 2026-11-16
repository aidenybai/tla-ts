(*---
description: Evaluates a random seq expression, seed 262, number 3197.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03197 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(LET b5080 == (-3) IN (CHOOSE b5081 \in {1} : FALSE) + (IF TRUE THEN 2 ELSE 3 * (2147483647 - [a |-> 1, b |-> TRUE]))), ([Tail(<<3, 1, 2>>) EXCEPT ![1] = (2 + 2147483647)] = [b5082 \in (-1 .. 2147483647) |-> (b5082 - -1)])>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03197 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 41 to line 14, col 68 of module random_03197
---*)
