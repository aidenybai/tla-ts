(*---
description: Evaluates a random bool expression, seed 262, number 3284.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03284 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 + 7) * Len(FALSE)) - (CHOOSE b5223 \in ({1} \cup {x \in 1..3 : x > 1}) : (b5223 \in 2..1))) \in {(Head(<<1>>) + (0 - 3)), ((3 - 3) * (<<5, 6>>)[1])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03284 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    FALSE
---*)
