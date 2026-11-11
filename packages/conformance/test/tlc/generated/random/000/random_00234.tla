(*---
description: Evaluates a random int expression, seed 262, number 234.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00234 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> ([x \in Nat |-> x + 1])[7], b |-> ([a |-> 1] = [a |-> 1, b |-> TRUE])]).a % (CHOOSE b385 \in UNION {{b386 \in {1} : b386}, {b387 : b387 \in 1}} : ((\A b388 \in 2..1 : FALSE) \/ (<<>> /\ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00234 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was an integer.
    line 14, col 141 to line 14, col 144 of module random_00234
---*)
