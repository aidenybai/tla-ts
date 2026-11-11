(*---
description: Evaluates a random int expression, seed 262, number 6634.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06634 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> ((TRUE => FALSE))[(-1 \div 3)], b |-> ((\A b10185 \in {2, 1, 3} : FALSE) <=> ({x \in 1..3 : x > 1} \subseteq Nat))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06634 failed.
    A non-function (a Boolean value) was applied as a function.
    line 14, col 24 to line 14, col 53 of module random_06634
---*)
