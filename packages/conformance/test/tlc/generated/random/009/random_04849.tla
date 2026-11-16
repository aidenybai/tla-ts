(*---
description: Evaluates a random bool expression, seed 262, number 4849.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04849 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (CHOOSE f \in [1..2 -> 1..2] : TRUE) \subseteq DOMAIN [[b7563 \in {} |-> b7563] EXCEPT ![(7 - 1)] = Len(<<1>>)]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 79 to line 14, col 102 of module random_04849
    | FALSE
---*)
