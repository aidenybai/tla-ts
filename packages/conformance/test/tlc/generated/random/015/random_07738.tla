(*---
description: Evaluates a random set expression, seed 262, number 7738.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07738 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[([a |-> 1, b |-> TRUE] = [a |-> 1]) EXCEPT !.a = (2147483647 * 7)] EXCEPT !.a = @ + ([a |-> 2, b |-> FALSE]).a] EXCEPT !.a = Cardinality(({b11939 \in 1..3 : TRUE} \cap (7 .. 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07738 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
