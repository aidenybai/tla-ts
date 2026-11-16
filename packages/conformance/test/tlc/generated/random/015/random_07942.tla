(*---
description: Evaluates a random seq expression, seed 262, number 7942.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07942 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [2..1 -> {0} \cup {1}] : TRUE) EXCEPT ![1] = LET b12255 == Cardinality({3 : b12256 \in {2, 1, 3}}) IN ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 3]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 59 of module random_07942
    | <<>>
---*)
