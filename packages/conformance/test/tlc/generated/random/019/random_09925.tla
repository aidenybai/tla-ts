(*---
description: Evaluates a random function expression, seed 262, number 9925.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09925 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{2, 1, 3} -> {0} \cup {1}] : TRUE) @@ [[b15440 \in (Nat \cap {2, 1, 3}) |-> (-b15440)] EXCEPT ![(((1 :> 2))[3] + (2 % 0))] = (([a |-> 1, b |-> TRUE]).a * (CHOOSE b15441 \in 2..1 : FALSE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09925 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)
