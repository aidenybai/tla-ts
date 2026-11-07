(*---
description: Evaluates a random int expression, seed 262, number 3926.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03926 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-((Head(<<>>) :> (-2147483647)))[[SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = (2..1 \div 1)]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
