(*---
description: Evaluates a random record expression, seed 262, number 4508.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04508 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b7082 \in {b7083 \in {7, 1} : (TRUE => FALSE)} : (\A b7084 \in (7 .. 1) : ([a |-> 1, b |-> TRUE] = [a |-> 1]))), b |-> (Cardinality((SUBSET {1} \ {2, 1, 3})) \/ (Tail(<<3, 1, 2>>) \/ (TRUE \/ FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04508 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 24 to line 14, col 140 of module random_04508
---*)
