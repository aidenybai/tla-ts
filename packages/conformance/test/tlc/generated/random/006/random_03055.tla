(*---
description: Evaluates a random record expression, seed 262, number 3055.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03055 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + (CHOOSE b4855 \in {b4856 \in UNION {{1, 2}, {x \in 1..3 : x > 1}} : (<<1, 2>> = [x \in Nat |-> x + 1])} : (Tail(<<1>>) = (b4855 :> [a |-> 1])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03055 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
