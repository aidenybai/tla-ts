(*---
description: Evaluates a random bool expression, seed 262, number 8765.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08765 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 :> 2))[([a |-> 1, b |-> TRUE]).a] .. (([a |-> 1, b |-> TRUE]).a - Len(<<3, 1, 2>>))) \subseteq {((b13572 - b13572) - ([a |-> 1]).a) : b13572 \in DOMAIN [b13573 \in 2..1 |-> 0]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08765 failed.
    Attempted to apply function:
    (3 :> 2)
    to argument 1, which is not in the domain of the function.
---*)
