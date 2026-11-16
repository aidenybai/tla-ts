(*---
description: Evaluates a random record expression, seed 262, number 6518.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06518 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = (((2 :> 7))[([a |-> 1]).a] = Cardinality(({} \ {x \in 1..3 : x > 1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06518 failed.
    Attempted to apply function:
    (2 :> 7)
    to argument 1, which is not in the domain of the function.
---*)
