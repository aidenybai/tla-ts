(*---
description: Evaluates a random int expression, seed 262, number 1115.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01115 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b1779 == (2147483647 + 2) IN LET b1780 == 2 IN 2147483647 % Head(SubSeq(<<3, 1, 2>>, 3, 2))) % ({Cardinality({1, 2}) : b1781 \in (2..1 \ {})} - (((1 :> 2))[1] * ([a |-> 1, b |-> TRUE]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01115 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
