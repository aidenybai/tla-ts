(*---
description: Evaluates a random set expression, seed 262, number 7762.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07762 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ((Head(<<1>>) :> (CHOOSE b11968 \in SUBSET {1} : TRUE)) @@ ((0 % 3) \in {1, 2147483647})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07762 failed.
    2169:0 The second argument of @@ should be a function, but instead it is:
    FALSE
---*)
