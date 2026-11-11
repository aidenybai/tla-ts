(*---
description: Evaluates a random bool expression, seed 262, number 6430.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06430 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b9896 == (-(Head(<<1, 2>>) + ((1 :> 2))[2])) IN ((([x \in Nat |-> x + 1])[b9896] - (1 % 2)) * ((b9896 :> 3))[(-1)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06430 failed.
    Attempted to apply function:
    <<2>>
    to argument 2, which is not in the domain of the function.
---*)
