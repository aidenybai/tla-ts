(*---
description: Evaluates a random bool expression, seed 262, number 9664.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09664 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[a |-> 3, b |-> FALSE] EXCEPT !.a = @ + Cardinality({1})]).a < (CHOOSE b15001 \in {Len(<<3, 1, 2>>), Len(<<>>)} : ([<<3, 1, 2>> EXCEPT ![1] = -1] = {b15001, FALSE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09664 failed.
    Attempted to compare boolean FALSE with non-boolean:
    0
---*)
