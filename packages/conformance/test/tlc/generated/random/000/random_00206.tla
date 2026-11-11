(*---
description: Evaluates a random bool expression, seed 262, number 206.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00206 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> Len(2147483647), b |-> (SUBSET {1} \subseteq 2..1)] EXCEPT !.a = (([a |-> 1]).a + (0 \div 2))] = [[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = Len([a |-> 1, b |-> TRUE])] EXCEPT !.a = Cardinality(({2, 1, 3} \ 3))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00206 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    2147483647
---*)
