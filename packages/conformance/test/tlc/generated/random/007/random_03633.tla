(*---
description: Evaluates a random function expression, seed 262, number 3633.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03633 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({3 : b5739 \in {1}} \cap ({} \ {2, 1, 3})) * ((CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE))[(3 + 2)]) :> ([[a |-> -1, b |-> TRUE] EXCEPT !.a = (2147483647 \div 2147483647)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03633 failed.
    Attempted to apply function:
    (0 :> 1 @@ 1 :> 1)
    to argument 5, which is not in the domain of the function.
---*)
