(*---
description: Evaluates a random function expression, seed 262, number 6716.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06716 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 % 7) + ((1 :> 2))[-1]) :> ((1 + 2) - Cardinality({1, 2}))) @@ [b10294 \in ((2147483647 .. 1) \cap {2 : b10295 \in 1..3}) |-> Cardinality({b10294, 3})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06716 failed.
    Attempted to apply function:
    <<2>>
    to argument -1, which is not in the domain of the function.
---*)
