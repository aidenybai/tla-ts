(*---
description: Evaluates a random int expression, seed 262, number 7015.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07015 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SelectSeq(SubSeq([<<>> EXCEPT ![1] = 0], ([a |-> 1]).a, (CHOOSE b10761 \in {1} : FALSE)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 38 to line 14, col 41 of module random_07015
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07015 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 77 to line 14, col 105 of module random_07015
---*)
