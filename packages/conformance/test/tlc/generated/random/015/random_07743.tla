(*---
description: Evaluates a random set expression, seed 262, number 7743.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07743 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {{b11946 : b11946 \in {x \in 1..3 : x > 1}}, {2, -1}} \ DOMAIN [(1 :> 2) EXCEPT ![-1] = 7]) \cap (((-1) - Len(7)) .. (CHOOSE b11947 \in {TRUE, 7} : ({2, 1, 3} = {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 89 to line 14, col 94 of module random_07743
    2283:0 The argument of Len should be a sequence, but instead it is:
    7
    2283:0 The argument of Len should be a sequence, but instead it is:
    7
---*)
