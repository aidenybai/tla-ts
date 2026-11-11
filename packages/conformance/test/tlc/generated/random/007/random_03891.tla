(*---
description: Evaluates a random set expression, seed 262, number 3891.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03891 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (({x \in 1..3 : x > 1} \ (1 :> 2)) \subseteq (Nat \ {1})) -> (CASE FALSE -> 7 [] OTHER -> 3 \div (CHOOSE b6124 \in Nat : TRUE)) [] OTHER -> (-LET b6125 == 2147483647 IN b6125) % CASE ((\A b6126 \in Nat : FALSE) \/ (TRUE /\ FALSE)) -> (Cardinality({1}) + (3 - 3)) [] OTHER -> IF (<<3, 1, 2>> /\ FALSE) THEN (Nat \div 3) ELSE ([x \in Nat |-> x + 1])[2147483647]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03891 failed.
    Attempted to check if the value:
    2
    is an element of the function <<2>>
---*)
