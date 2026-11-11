(*---
description: Evaluates a random int expression, seed 262, number 4523.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04523 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b7106 \in ({Head(<<3, 1, 2>>) : b7107 \in ({x \in 1..3 : x > 1} \cap Nat)} \ (DOMAIN [x \in 1..2 |-> x] \cap {7, 0})) : (<<(b7106 + -1), (\A b7108 \in 2..1 : TRUE)>> = [b7109 \in (TRUE => FALSE) |-> (-{x \in 1..3 : x > 1})])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04523 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
