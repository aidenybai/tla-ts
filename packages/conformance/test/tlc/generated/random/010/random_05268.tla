(*---
description: Evaluates a random seq expression, seed 262, number 5268.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05268 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CHOOSE r \in [a : 2..1] : TRUE)).a EXCEPT ![1] = (IF SubSeq([x \in 1..2 |-> x], 2, 2) THEN LET b8157 == 3 IN 3 ELSE IF TRUE THEN -1 ELSE 2147483647 * (-(0 - 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05268 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 48 of module random_05268
---*)
