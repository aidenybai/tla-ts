(*---
description: Evaluates a random bool expression, seed 262, number 2338.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02338 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF FALSE THEN 2147483647 ELSE 7 * Len(<<>>)) - IF (\E b3707 \in {1} : TRUE) THEN (1..3)[2] ELSE (CHOOSE b3708 \in SUBSET {1} : FALSE)) % ((CHOOSE b3709 \in ({2, 1, 3} \cup 1..3) : (b3709 \in {2, 1, 3})) \div (LET b3710 == 1 IN b3710 % (1 \in 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02338 failed.
    A non-function (a set of the form i..j) was applied as a function.
    line 14, col 100 to line 14, col 108 of module random_02338
---*)
