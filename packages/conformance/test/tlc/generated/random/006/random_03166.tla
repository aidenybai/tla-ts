(*---
description: Evaluates a random set expression, seed 262, number 3166.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03166 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ([[[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 7] EXCEPT ![(3 + 0)] = (TRUE - {2, 1, 3})] @@ ([[x \in 1..2 |-> x] EXCEPT ![1] = 1] @@ ((1 :> 2) @@ (1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03166 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
