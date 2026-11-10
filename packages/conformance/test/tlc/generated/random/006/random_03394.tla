(*---
description: Evaluates a random int expression, seed 262, number 3394.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03394 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(LET b5394 == (CHOOSE b5395 \in {1, 2} : FALSE) IN (<<1, 2>>)[2147483647] * (Len(<<1, 2>>) % IF FALSE THEN 2147483647 ELSE 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03394 failed.
    Attempted to access index 2147483647 of tuple
    <<1, 2>>
    which is out of bounds.
---*)
