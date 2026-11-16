(*---
description: Evaluates a random set expression, seed 262, number 1687.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01687 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b2694 \in DOMAIN [a |-> b2693, b |-> FALSE] : (\A b2695 \in {b2696 \in {2, 1, 3} : FALSE} : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]))) : b2693 \in ((UNION {{1, 2}, {1, 2}} \cap (Nat \ {2, 1, 3})) \cap (((1 :> 2))[2147483647] .. Len(<<>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01687 failed.
    Attempted to apply function:
    <<2>>
    to argument 2147483647, which is not in the domain of the function.
---*)
