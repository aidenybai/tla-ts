(*---
description: Evaluates a random bool expression, seed 262, number 5957.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05957 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(({-1, 2147483647} \cap UNION {(1 :> 2), 0})) < ((CHOOSE b9192 \in {Nat, 3} : ([x \in 1..2 |-> x] \in {x \in 1..3 : x > 1})) \div CASE (0 = 1) -> (-1 % {}) [] OTHER -> ([a |-> 1, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05957 failed.
    Attempted to compare integer 0 with non-integer:
    <<2>>
---*)
