(*---
description: Evaluates a random set expression, seed 262, number 8556.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08556 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b13258 \in DOMAIN ((7 :> 0) @@ [[x \in 1..2 |-> x] EXCEPT ![1] = 2]) : ((-IF FALSE THEN 2147483647 ELSE b13258) = (-(<<1, 2>> = [x \in Nat |-> x + 1])))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08556 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
