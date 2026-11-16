(*---
description: Evaluates a random int expression, seed 262, number 6672.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06672 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-((-(3 \div 7)) \div ((3 :> 0))[Len(<<1, 2>>)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06672 failed.
    Attempted to apply function:
    (3 :> 0)
    to argument 2, which is not in the domain of the function.
---*)
