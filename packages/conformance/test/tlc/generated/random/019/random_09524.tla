(*---
description: Evaluates a random function expression, seed 262, number 9524.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09524 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((CHOOSE b14792 \in SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) : (0 = b14792)) % (([x \in Nat |-> x + 1] @@ <<5, 6>>))[(3 - 1)]), CASE (DOMAIN [x \in Nat |-> x + 1] = (3 \in 1..3)) -> ((7 + 7) * (1 * 1)) [] OTHER -> ((-0) :> (7 * 2))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09524 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 19 to line 14, col 92 of module random_09524
---*)
