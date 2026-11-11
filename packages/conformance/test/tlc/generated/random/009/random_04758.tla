(*---
description: Evaluates a random int expression, seed 262, number 4758.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04758 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-Cardinality(DOMAIN (1 :> 2))) % (Len([<<>> EXCEPT ![1] = 2147483647]) \div IF (FALSE /\ TRUE) THEN (0 * 1) ELSE (7 \div 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 57 to line 14, col 60 of module random_04758
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04758 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
