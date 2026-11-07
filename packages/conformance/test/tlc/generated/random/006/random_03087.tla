(*---
description: Evaluates a random seq expression, seed 262, number 3087.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03087 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([SelectSeq([<<1>> EXCEPT ![1] = -1], LAMBDA e : e > 0) EXCEPT ![1] = ([[a |-> 1] EXCEPT !.a = @ + 3]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 22 to line 14, col 74 of module random_03087
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
