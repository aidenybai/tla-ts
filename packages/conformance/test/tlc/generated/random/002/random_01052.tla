(*---
description: Evaluates a random function expression, seed 262, number 1052.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01052 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality((({1, 2} \ {2, 1, 3}) \cap UNION {{x \in 1..3 : x > 1}, SUBSET {1}})) :> IF (({1} = Nat) /\ ([a |-> 1, b |-> TRUE] /\ FALSE)) THEN CASE ([a |-> 1] = [a |-> 1, b |-> TRUE]) -> LET b1685 == 7 IN TRUE [] OTHER -> LET b1686 == 1 IN 3 ELSE CASE (TRUE => FALSE) -> (1 \div 1) [] OTHER -> Cardinality({x \in 1..3 : x > 1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01052 failed.
    Attempted to check equality of the set {1} with the value:
    Nat
---*)
