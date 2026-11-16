(*---
description: Evaluates a random record expression, seed 262, number 3766.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03766 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail([[<<3, 1, 2>> EXCEPT ![1] = 1] EXCEPT ![1] = (0 * 2)]) EXCEPT !.a = IF ((<<1, 2>> = [x \in Nat |-> x + 1]) <=> ([x \in 1..2 |-> x])[-1]) THEN (-(2 % 1)) ELSE [(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + Len(<<1>>)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03766 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
