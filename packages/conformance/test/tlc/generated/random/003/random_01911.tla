(*---
description: Evaluates a random set expression, seed 262, number 1911.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01911 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((CHOOSE f \in [1..2 -> 1..2] : TRUE))[((1 :> 2))[3]] + (Len(<<1>>) % ([a |-> 1]).a)) : b3001 \in {Len([<<3, 1, 2>> EXCEPT ![1] = -1]), (Len(<<3, 1, 2>>) + (2147483647 % 3))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01911 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)
