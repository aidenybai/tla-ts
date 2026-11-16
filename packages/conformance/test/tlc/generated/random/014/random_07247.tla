(*---
description: Evaluates a random record expression, seed 262, number 7247.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07247 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + (((0 @@ (1 :> 2)))[(-1)] % (CHOOSE b11146 \in {2147483647, 1} : (TRUE <=> TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07247 failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    0
---*)
