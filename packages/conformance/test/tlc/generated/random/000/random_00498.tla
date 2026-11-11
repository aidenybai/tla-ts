(*---
description: Evaluates a random int expression, seed 262, number 498.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00498 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b824 == ([[a |-> 1] EXCEPT !.a = 0]).a IN (LET b825 == b824 IN b825 \div (b824 - b824)) * CASE (\A b826 \in ({1, 2} \ SUBSET {1}) : ([a |-> 1] = [a |-> 1, b |-> TRUE])) -> Cardinality((1..3 \cup {1})) [] OTHER -> CASE (SUBSET {1} \subseteq {x \in 1..3 : x > 1}) -> ({x \in 1..3 : x > 1}).a [] OTHER -> ([x \in 1..2 |-> x])[1]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00498 failed.
    2179:0 The second argument of \div is 0.
---*)
