(*---
description: Evaluates a random int expression, seed 262, number 7744.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07744 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(LET b11948 == Len(<<1, 2>>) IN ([a |-> 1, b |-> TRUE]).a + CASE (FALSE /\ FALSE) -> CASE FALSE -> 2147483647 [] OTHER -> 2147483647 [] OTHER -> ((1 :> 2))[7])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07744 failed.
    Attempted to apply function:
    <<2>>
    to argument 7, which is not in the domain of the function.
---*)
