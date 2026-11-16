(*---
description: Evaluates a random set expression, seed 262, number 230.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00230 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (FALSE /\ FALSE) THEN [a |-> 0, b |-> FALSE] ELSE Len(<<>>) * Tail((\A b375 \in 1..3 : TRUE))) .. (([(1 :> 2) EXCEPT ![1] = 2147483647])[(2 - 0)] * ((-1 * 0) + LET b376 == 1 IN b376))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00230 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    TRUE
---*)
