(*---
description: Evaluates a random bool expression, seed 262, number 4165.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04165 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 + 1) % Cardinality(2..1)) :> LET b6554 == (2 \div 7) IN (3 - 2)) => (((0 * 1) - IF FALSE THEN 7 ELSE 1) = CASE (<<1, 2>> = [x \in Nat |-> x + 1]) -> (1 * 2..1) [] OTHER -> Cardinality({x \in 1..3 : x > 1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04165 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
