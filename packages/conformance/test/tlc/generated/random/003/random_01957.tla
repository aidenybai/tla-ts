(*---
description: Evaluates a random bool expression, seed 262, number 1957.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01957 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((\A b3083 \in 2..1 : FALSE) => (TRUE <=> FALSE)) \/ ((CHOOSE b3084 \in {1} : FALSE) \in (FALSE \cap {1}))) => (-(IF TRUE THEN -1 ELSE {1} \div (7 - 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01957 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 73 to line 14, col 100 of module random_01957
---*)
