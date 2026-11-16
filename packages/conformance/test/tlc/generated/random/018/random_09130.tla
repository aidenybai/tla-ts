(*---
description: Evaluates a random int expression, seed 262, number 9130.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09130 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Append(<<([x \in Nat |-> x + 1])[0], Head(<<3, 1, 2>>)>>, ([(1 :> 2) EXCEPT ![3] = 2147483647])[CASE TRUE -> 2147483647 [] OTHER -> 7])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 82 to line 14, col 87 of module random_09130
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09130 failed.
    Attempted to apply function:
    <<2>>
    to argument 2147483647, which is not in the domain of the function.
---*)
