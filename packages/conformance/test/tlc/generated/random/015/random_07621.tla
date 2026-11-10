(*---
description: Evaluates a random set expression, seed 262, number 7621.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07621 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<((2 :> -1))[([a |-> 1, b |-> TRUE]).a], ((CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE))[([x \in 1..2 |-> x])[2]]>> EXCEPT ![1] = LET b11724 == (CHOOSE b11725 \in DOMAIN <<5, 6>> : (b11725 = 2..1)) IN LET b11726 == (-b11724) IN (-3)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07621 failed.
    Attempted to apply function:
    (2 :> -1)
    to argument 1, which is not in the domain of the function.
---*)
