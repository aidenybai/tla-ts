(*---
description: Evaluates a random seq expression, seed 262, number 55.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00055 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq([SelectSeq(<<>>, LAMBDA e : e > 0) EXCEPT ![1] = ((1 :> 2))[2]], Len([<<>> EXCEPT ![1] = 0]), (Cardinality(1..3) + (3 % 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 29 to line 14, col 61 of module random_00055
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 98 to line 14, col 101 of module random_00055
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00055 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
---*)
