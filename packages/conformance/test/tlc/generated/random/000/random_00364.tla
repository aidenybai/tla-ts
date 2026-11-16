(*---
description: Evaluates a random function expression, seed 262, number 364.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00364 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-IF (<<1>> = [x \in Nat |-> x + 1]) THEN (0 + 0) ELSE CASE FALSE -> 1 [] OTHER -> 7) :> (Head(SubSeq(<<>>, 3, 1)) * Cardinality((7 .. 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00364 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
