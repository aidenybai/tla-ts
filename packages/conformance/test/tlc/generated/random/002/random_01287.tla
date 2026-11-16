(*---
description: Evaluates a random int expression, seed 262, number 1287.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01287 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((((1 :> 2))[-1] :> LET b2048 == -1 IN b2048) @@ ([[a |-> 1] EXCEPT !.a = @ + 7]).a))[Len(SubSeq([<<1, 2>> EXCEPT ![1] = 1], (<<1>> + 2), (-2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01287 failed.
    Attempted to apply function:
    <<2>>
    to argument -1, which is not in the domain of the function.
---*)
