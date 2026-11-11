(*---
description: Evaluates a random set expression, seed 262, number 8106.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08106 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [(([x \in Nat |-> x + 1])[3] :> SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) EXCEPT ![[SelectSeq(<<>>, LAMBDA e : e > 0) EXCEPT ![1] = (2 + 3)]] = ((3 :> -1))[Cardinality({x \in 1..3 : x > 1})]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 104 to line 14, col 136 of module random_08106
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08106 failed.
    Attempted to check equality of integer 4 with non-integer:
    <<>>
---*)
