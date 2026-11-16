(*---
description: Evaluates a random int expression, seed 262, number 3052.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03052 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (~(((1 :> 2))[2] = (Nat % FALSE))) -> ([a |-> Head(<<3, 1, 2>>), b |-> (~FALSE)]).a [] OTHER -> Len([Append((1 :> 2), 7) EXCEPT ![1] = (-2147483647)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03052 failed.
    Attempted to apply function:
    <<2>>
    to argument 2, which is not in the domain of the function.
---*)
