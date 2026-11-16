(*---
description: Evaluates a random set expression, seed 262, number 5954.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05954 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((0 * 3) + (0 \div 1)), CASE (<<3, 1, 2>> = [x \in Nat |-> x + 1]) -> (2 + 7) [] OTHER -> (2 + 0)} \cap {b9183 \in UNION {{2 : b9184 \in {x \in 1..3 : x > 1}}, {-1, 0}} : ((-7) \in UNION {Nat, {1, 2}})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05954 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
