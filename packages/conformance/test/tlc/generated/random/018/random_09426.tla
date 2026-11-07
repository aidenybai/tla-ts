(*---
description: Evaluates a random bool expression, seed 262, number 9426.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09426 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b14623 \in {Head([<<3, 1, 2>> EXCEPT ![1] = 0]) : b14624 \in UNION {{7, 1}, ({1} \cap 1..3)}} : ([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + ([x \in Nat |-> x + 1])[b14623]] = [(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = ((1 :> 2))[2147483647]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09426 failed.
    Attempted to apply function:
    <<2>>
    to argument 2147483647, which is not in the domain of the function.
---*)
