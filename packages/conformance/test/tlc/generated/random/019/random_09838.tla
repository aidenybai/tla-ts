(*---
description: Evaluates a random bool expression, seed 262, number 9838.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09838 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN (0 :> 7) \subseteq (\E b15276 \in (2 .. 7) : ({x \in 1..3 : x > 1} = {x \in 1..3 : x > 1}))) => ((-(2147483647 * 0)) \in {([a |-> 1, b |-> TRUE]).a, Head(<<3, 1, 2>>)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09838 failed.
    Attempted to check if the value:
    0
    is an element of the boolean TRUE
---*)
