(*---
description: Evaluates a random bool expression, seed 262, number 9812.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09812 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((2..1 \subseteq [a |-> 1, b |-> TRUE]) /\ ([a |-> 1] = [a |-> 1])) THEN (CHOOSE b15231 \in (0 .. -1) : (<<3, 1, 2>> = <<5, 6>>)) ELSE Cardinality({b15232 : b15232 \in {x \in 1..3 : x > 1}}) = DOMAIN [[<<5, 6>> EXCEPT ![1] = -1] EXCEPT ![Cardinality(2..1)] = (2147483647 % 2)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09812 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 94 to line 14, col 147 of module random_09812
---*)
