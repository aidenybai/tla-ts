(*---
description: Evaluates a random set expression, seed 262, number 5810.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05810 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({(2 \div 0), CASE FALSE -> -1 [] OTHER -> 7}) .. (((-1 % 2147483647) + CASE TRUE -> 2 [] OTHER -> 0) - ((-1) - Head(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05810 failed.
    2179:0 The second argument of \div is 0.
---*)
