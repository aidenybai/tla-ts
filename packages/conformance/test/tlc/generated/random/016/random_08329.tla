(*---
description: Evaluates a random seq expression, seed 262, number 8329.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08329 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(Head([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2]) - (-((1 :> 2))[2147483647])), (CHOOSE b12883 \in DOMAIN [<<5, 6>> EXCEPT ![7] = 3] : ((\A b12884 \in 1..3 : TRUE) => {b12885 : b12885 \in 1..3}))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08329 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 3, b |-> TRUE]
---*)
