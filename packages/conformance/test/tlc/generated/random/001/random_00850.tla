(*---
description: Evaluates a random seq expression, seed 262, number 850.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00850 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((Cardinality({2, 1, 3}) \div IF FALSE THEN 0 ELSE 0) - Head([<<1>> EXCEPT ![1] = 3])), ([[b1387 \in SUBSET {1} |-> 0] EXCEPT ![Head(<<1>>)] = CASE FALSE -> <<5, 6>> [] OTHER -> 3])[(LET b1388 == 3 IN b1388 * Cardinality(SUBSET {1}))]>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00850 failed.
    2179:0 The second argument of \div is 0.
---*)
