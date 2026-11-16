(*---
description: Evaluates a random bool expression, seed 262, number 132.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00132 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b205 \in ({[(1 :> 2) EXCEPT ![b206] = 2147483647] : b206 \in {-1, 3}} \cap (({1} \ 2..1) \ {b207 \in 1..3 : FALSE})) : ((SelectSeq(<<1, 2>>, LAMBDA e : e > 0) = (<<5, 6>> @@ b205)) \/ (~(TRUE \/ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 33 to line 14, col 38 of module random_00132
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00132 failed.
    Attempted to check equality of integer 1 with non-integer:
    <<2>>
---*)
