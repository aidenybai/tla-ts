(*---
description: Evaluates a random bool expression, seed 262, number 3242.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03242 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [(-1 :> 2) EXCEPT ![(1 * 3)] = LET b5157 == 3 IN b5157] \subseteq ({IF FALSE THEN b5158 ELSE 2147483647 : b5158 \in {b5159 : b5159 \in 0}} \cup UNION {(1..3 \cup {1}), DOMAIN [x \in Nat |-> x + 1]})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 32 of module random_03242
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03242 failed.
    TLC encountered a non-enumerable quantifier bound
    0.
    0
---*)
