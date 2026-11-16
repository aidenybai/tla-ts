(*---
description: Evaluates a random seq expression, seed 262, number 9231.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09231 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SelectSeq(([<<5, 6>> EXCEPT ![2147483647] = 2147483647] @@ ((1 :> 2) @@ (1 :> 2))), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 33 to line 14, col 40 of module random_09231
    | <<6>>
---*)
