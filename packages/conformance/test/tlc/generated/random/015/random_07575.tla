(*---
description: Evaluates a random function expression, seed 262, number 7575.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07575 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SelectSeq([<<>> EXCEPT ![1] = 0], LAMBDA e : e > 0)) :> ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 33 to line 14, col 36 of module random_07575
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07575 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
