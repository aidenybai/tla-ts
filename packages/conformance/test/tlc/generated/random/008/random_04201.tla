(*---
description: Evaluates a random bool expression, seed 262, number 4201.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04201 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> (7 - 1), b |-> ([x \in Nat |-> x + 1] <=> FALSE)] EXCEPT ![Cardinality((1 .. 1))] = (Cardinality(2..1) - Head(<<3, 1, 2>>))] \subseteq ([a |-> IF FALSE THEN 1 ELSE [a |-> 1, b |-> TRUE], b |-> (TRUE /\ 3)] \cap UNION {(CHOOSE b6609 \in 2..1 : TRUE), (Nat \cup 1..3)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04201 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 41 to line 14, col 71 of module random_04201
---*)
