(*---
description: Evaluates a random bool expression, seed 262, number 8145.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08145 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b12592 == ((TRUE).a * (2147483647 * 0)) IN ((7 \div b12592) \div IF FALSE THEN 3 ELSE -1) < (Head([[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]) * (LET b12593 == 2 IN b12593 * Cardinality({1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08145 failed.
    Attempted to select field "a" from a non-record value TRUE
    line 14, col 32 to line 14, col 39 of module random_08145
---*)
