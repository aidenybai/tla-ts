(*---
description: Evaluates a random int expression, seed 262, number 9378.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09378 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SubSeq(Tail(SubSeq(<<1>>, 2147483647, 1)), (-Head(<<1>>)), LET b14553 == (7 - 7) IN ((1 :> 2))[7])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
