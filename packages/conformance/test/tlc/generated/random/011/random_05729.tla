(*---
description: Evaluates a random seq expression, seed 262, number 5729.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05729 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SelectSeq(((<<3, 1, 2>> = [x \in Nat |-> x + 1]) \/ (TRUE \/ TRUE)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05729 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
