(*---
description: Evaluates a random seq expression, seed 262, number 2803.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02803 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Append(SelectSeq([<<>> EXCEPT ![1] = 2], LAMBDA e : e > 0), Len(Append(<<1, 2>>, 1)))))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 39 to line 14, col 42 of module random_02803
    | <<>>
---*)
