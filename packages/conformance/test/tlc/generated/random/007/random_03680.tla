(*---
description: Evaluates a random bool expression, seed 262, number 3680.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03680 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(Tail(<<1>>) = [(1 :> 2) EXCEPT ![-1] = 2])) /\ (UNION {{2, 2}, (0 .. -1)} \subseteq DOMAIN [[x \in 1..2 |-> x] EXCEPT ![0] = -1])))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 36 to line 14, col 41 of module random_03680
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 112 to line 14, col 129 of module random_03680
    | TRUE
---*)
