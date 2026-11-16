(*---
description: Evaluates a random int expression, seed 262, number 8425.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08425 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (([x \in 1..2 |-> x] @@ (1 :> 2)))[((1 :> 2))[2147483647]], b |-> ((2 < 7) <=> (\A b13043 \in Nat : TRUE))] EXCEPT !.a = @ + (((-2) * (1 * [a |-> 1])) * (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08425 failed.
    Attempted to apply function:
    <<2>>
    to argument 2147483647, which is not in the domain of the function.
---*)
