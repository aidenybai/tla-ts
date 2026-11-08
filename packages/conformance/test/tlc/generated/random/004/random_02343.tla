(*---
description: Evaluates a random int expression, seed 262, number 2343.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02343 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((LET b3715 == -1 IN 1 + (2147483647 \div 0)) \div (LET b3716 == -1 IN b3716 * (CHOOSE b3717 \in SUBSET {1} : TRUE))) + Head((<<2147483647, 2147483647>> \o SelectSeq(<<1>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02343 failed.
    2179:0 The second argument of \div is 0.
---*)
