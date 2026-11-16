(*---
description: Evaluates a random seq expression, seed 262, number 5892.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05892 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<LET b9091 == ([(1 :> 2) EXCEPT ![2147483647] = 2147483647])[(3 - -1)] IN (-(b9091 - 7)), Len(<<Head(<<3, 1, 2>>), (0 * 0)>>)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 34 to line 14, col 39 of module random_05892
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05892 failed.
    Attempted to apply function:
    <<2>>
    to argument 4, which is not in the domain of the function.
---*)
