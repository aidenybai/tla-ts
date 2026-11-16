(*---
description: Evaluates a random int expression, seed 262, number 466.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00466 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([({} \subseteq {1, 2}) EXCEPT !.a = @ + LET b770 == 2147483647 IN b770]).a + (((-1) - Head([a |-> 1, b |-> TRUE])) + ([a |-> 3, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00466 failed.
    Attempted to apply EXCEPT construct to the value TRUE.
---*)
