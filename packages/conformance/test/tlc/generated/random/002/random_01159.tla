(*---
description: Evaluates a random int expression, seed 262, number 1159.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01159 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> SubSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), (2147483647 .. 2147483647), ((1 :> 2))[2]), b |-> ((TRUE \/ TRUE) = (0 :> 1))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01159 failed.
    Attempted to apply function:
    <<2>>
    to argument 2, which is not in the domain of the function.
---*)
