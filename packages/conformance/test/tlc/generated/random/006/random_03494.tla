(*---
description: Evaluates a random int expression, seed 262, number 3494.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03494 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> Cardinality(SUBSET {1}), b |-> (FALSE => FALSE)] EXCEPT !.a = @ + ([b5520 \in 2..1 |-> b5520])[IF TRUE THEN 3 ELSE 0]]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03494 failed.
    In applying the function
    <<>>,
    the first argument is:
    3
    which is not in its domain.
---*)
