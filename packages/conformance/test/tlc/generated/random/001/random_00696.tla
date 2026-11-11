(*---
description: Evaluates a random function expression, seed 262, number 696.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00696 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(IF TRUE THEN 2 ELSE 0 :> (2 % 2147483647)) EXCEPT ![CASE (FALSE \/ FALSE) -> (-1) [] OTHER -> (-1 \div 2)] = ((1 * 1) \div ([x \in 1..2 |-> x]).a)] @@ (CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00696 failed.
    Attempted to apply EXCEPT construct to the value 2.
---*)
