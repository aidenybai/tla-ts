(*---
description: Evaluates a random record expression, seed 262, number 3436.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03436 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = ((Len(TRUE) - (-1 \div 7)) * Cardinality((3 .. -1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03436 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    TRUE
---*)
