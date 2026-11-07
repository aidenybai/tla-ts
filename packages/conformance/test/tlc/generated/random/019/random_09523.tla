(*---
description: Evaluates a random seq expression, seed 262, number 9523.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09523 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail({Head(<<>>), Head(<<3, 1, 2>>)}), LET b14791 == ((2147483647 - 3) - (2147483647 :> 1)) IN ((b14791 + 7) \div Len(<<1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
