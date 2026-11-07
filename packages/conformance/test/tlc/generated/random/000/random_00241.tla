(*---
description: Evaluates a random seq expression, seed 262, number 241.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00241 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail(Tail([<<>> EXCEPT ![1] = 3])) EXCEPT ![1] = ((CHOOSE b399 \in {b400 \in {x \in 1..3 : x > 1} : FALSE} : (FALSE \/ FALSE)) + ((-0) + (-1 * 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 28 to line 14, col 31 of module random_00241
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
