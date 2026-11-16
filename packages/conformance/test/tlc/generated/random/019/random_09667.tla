(*---
description: Evaluates a random set expression, seed 262, number 9667.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09667 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((1..3 \cap {1}) \ (2 :> 2)) \cap {(-1 + 2147483647), (-2147483647)}) \ DOMAIN ([a |-> 3, b |-> TRUE] = [FALSE EXCEPT !.a = TRUE])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09667 failed.
    Attempted to check if the value:
    1
    is an element of the function (2 :> 2)
---*)
