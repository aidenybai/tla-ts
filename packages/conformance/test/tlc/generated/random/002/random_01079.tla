(*---
description: Evaluates a random seq expression, seed 262, number 1079.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01079 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([SelectSeq([<<1>> EXCEPT ![1] = -1], LAMBDA e : e > 0) EXCEPT ![1] = (([a |-> 1, b |-> TRUE])[2147483647] - (CHOOSE b1721 \in {2, 1, 3} : FALSE))], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 27 to line 14, col 79 of module random_01079
    | <<>>
---*)
