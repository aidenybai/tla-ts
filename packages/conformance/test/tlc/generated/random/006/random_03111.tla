(*---
description: Evaluates a random int expression, seed 262, number 3111.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03111 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((3 * 7) \div (1 \div 1))) = DOMAIN ((2 :> 3) @@ ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03111 failed.
    Attempted to check equality of integer -21 with non-integer:
    {1, 2}
---*)
