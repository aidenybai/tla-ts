(*---
description: Evaluates a random bool expression, seed 262, number 3784.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03784 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((TRUE => FALSE))[(1 % 0)] * ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a) \in {(Head(<<>>) + ([x \in Nat |-> x + 1])[b5974]) : b5974 \in ((3 * 3) .. (3 \in 2..1))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03784 failed.
    A non-function (a Boolean value) was applied as a function.
    line 14, col 18 to line 14, col 43 of module random_03784
---*)
