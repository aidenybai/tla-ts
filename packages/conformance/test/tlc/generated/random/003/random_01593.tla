(*---
description: Evaluates a random seq expression, seed 262, number 1593.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01593 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<([(1 :> 2) EXCEPT ![2] = 0])[Len(<<3, 1, 2>>)], (IF {1, 2} THEN [a |-> 1] ELSE 3 % [b2546 \in <<>> |-> b2546])>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 29 to line 14, col 34 of module random_01593
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01593 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)
