(*---
description: Evaluates a random seq expression, seed 262, number 1891.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01891 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(Tail([<<>> EXCEPT ![1] = 3]), LAMBDA e : e > 0) EXCEPT ![1] = Head(SubSeq(<<7, 2147483647>>, LET b2968 == 3 IN b2968, (0 * 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 33 to line 14, col 36 of module random_01891
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
