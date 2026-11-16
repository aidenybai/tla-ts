(*---
description: Evaluates a random bool expression, seed 262, number 5688.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05688 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(-([a |-> 1]).a), (([x \in 1..2 |-> x])[2147483647] - (1 + 3))} \subseteq (({2, 3} \cup {b8765 \in 1 : FALSE}) \cap UNION {(Nat \cap 1..3), {b8766 \in {1, 2} : FALSE}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05688 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    2147483647
    which is not in its domain.
---*)
