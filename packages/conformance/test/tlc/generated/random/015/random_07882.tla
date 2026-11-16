(*---
description: Evaluates a random bool expression, seed 262, number 7882.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07882 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b12168 \in ((CHOOSE f \in [1..2 -> {}] : TRUE) @@ (CASE TRUE -> 2 [] OTHER -> 2 :> (TRUE /\ FALSE))) : (\A b12169 \in DOMAIN (b12168 :> 7) : Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07882 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 33 to line 14, col 64 of module random_07882
---*)
