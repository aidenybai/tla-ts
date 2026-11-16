(*---
description: Evaluates a random bool expression, seed 262, number 7758.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07758 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(IF (3 < 2147483647) THEN ([a |-> 1, b |-> TRUE]).a ELSE UNION {Nat, 2..1} < (IF TRUE THEN 7 ELSE 7 % (2147483647 * 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07758 failed.
    Attempted to apply the operator ~ to a non-boolean
    (an integer)
    line 14, col 17 to line 14, col 137 of module random_07758
---*)
