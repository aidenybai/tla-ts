(*---
description: Evaluates a random function expression, seed 262, number 7204.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07204 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([<<>> EXCEPT !.a = @ + 2147483647]).a :> ((1 - 0) - Head(<<1>>))) @@ (CHOOSE f \in [2..1 -> 2..1] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07204 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
