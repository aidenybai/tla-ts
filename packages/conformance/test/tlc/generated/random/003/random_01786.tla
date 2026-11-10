(*---
description: Evaluates a random set expression, seed 262, number 1786.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01786 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b2828 \in ({3, 3} \cap ({1} \cap Nat)) : (([a |-> 1, b |-> TRUE] = [a |-> 1]) /\ (FALSE /\ TRUE))), ((Head(<<1>>) + (1 % 1)) * IF (\E b2829 \in {2, 1, 3} : TRUE) THEN (TRUE \in {1}) ELSE Cardinality(3))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01786 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 121 of module random_01786
---*)
