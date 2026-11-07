(*---
description: Evaluates a random set expression, seed 262, number 6750.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06750 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (((3 :> 2))[(-3)] :> Head(Tail(<<1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06750 failed.
    Attempted to apply function:
    (3 :> 2)
    to argument -3, which is not in the domain of the function.
---*)
