(*---
description: Evaluates a random seq expression, seed 262, number 8721.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08721 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([((3 :> 2) @@ (CHOOSE f \in [{} -> {}] : TRUE)) EXCEPT ![1] = ((CHOOSE b13506 \in {x \in 1..3 : x > 1} : FALSE) - ((1 :> 2))[2])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 23 to line 14, col 66 of module random_08721
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08721 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    (3 :> 2)
---*)
