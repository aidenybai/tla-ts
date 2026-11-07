(*---
description: Evaluates a random function expression, seed 262, number 1951.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01951 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Head([SelectSeq(<<>>, LAMBDA e : e > 0) EXCEPT ![1] = CASE TRUE -> 1 [] OTHER -> 1]), (((1 \div 7) + LET b3074 == 0 IN 2) * (([a |-> 1, b |-> TRUE]).a - IF TRUE THEN 2147483647 ELSE 0))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 24 to line 14, col 56 of module random_01951
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
