(*---
description: Evaluates a random int expression, seed 262, number 4626.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04626 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-([[(1 :> 2) EXCEPT ![2147483647] = 1] EXCEPT ![(0 % 2)] = (-7)])[Head(<<3, 3>>)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 22 to line 14, col 27 of module random_04626
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 54 of module random_04626
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04626 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)
