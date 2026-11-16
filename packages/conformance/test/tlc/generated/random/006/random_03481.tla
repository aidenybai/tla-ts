(*---
description: Evaluates a random int expression, seed 262, number 3481.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03481 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b5495 \in {b5496 \in {1, 2} : <<1>>} : (1 = b5495)) * (LET b5497 == 0 IN 2147483647 - ([x \in Nat |-> x + 1])[{1, 2}])) + ([a |-> Cardinality({1}), b |-> (CHOOSE f \in [2..1 -> 2..1] : TRUE)])[((CHOOSE f \in [{} -> {0} \cup {1}] : TRUE))[Head(<<1>>)]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03481 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a tuple.
    line 14, col 56 to line 14, col 60 of module random_03481
---*)
