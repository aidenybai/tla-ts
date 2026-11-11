(*---
description: Evaluates a random bool expression, seed 262, number 3515.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03515 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (FALSE /\ TRUE) -> (-1 * 2) [] OTHER -> (3 \div 0) - ((3 :> -1))[(1 * TRUE)]) = ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03515 failed.
    2179:0 The second argument of \div is 0.
---*)
