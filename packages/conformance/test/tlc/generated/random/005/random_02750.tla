(*---
description: Evaluates a random bool expression, seed 262, number 2750.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02750 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Tail([[a |-> 1] EXCEPT !.a = @ + -1]) = ([b4341 \in 1..3 |-> {2, 1, 3}] @@ [[x \in Nat |-> x + 1] EXCEPT ![7] = 7])) <=> ((([a |-> 1] = [a |-> 1]) => [a |-> 3, b |-> TRUE]) => ((3 + -1) < Head(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02750 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    [a |-> 0]
---*)
