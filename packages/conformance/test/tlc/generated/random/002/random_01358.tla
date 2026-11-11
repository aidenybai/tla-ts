(*---
description: Evaluates a random record expression, seed 262, number 1358.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01358 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = [a |-> 1]] EXCEPT !.a = @ + Len(TRUE)] EXCEPT !.a = ((CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE))[({1, 2} \subseteq {})]] EXCEPT !.a = (-Cardinality(UNION {SUBSET {1}, SUBSET {1}}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01358 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    TRUE
---*)
