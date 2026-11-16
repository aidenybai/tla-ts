(*---
description: Evaluates a random bool expression, seed 262, number 3293.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03293 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) = [a |-> (([x \in 1..2 |-> x])[7] + CASE FALSE -> 1 [] OTHER -> 7), b |-> ({b5235 \in 2..1 : FALSE} \subseteq (0 .. [a |-> 1, b |-> TRUE]))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03293 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    7
    which is not in its domain.
---*)
