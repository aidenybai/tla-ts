(*---
description: Evaluates a random seq expression, seed 262, number 6222.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06222 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([[Tail(<<1>>) EXCEPT ![1] = [[a |-> 1] EXCEPT !.a = @ + 7]] EXCEPT ![1] = CASE (FALSE <=> TRUE) -> (-1 % -1) [] OTHER -> Cardinality(1..3)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 23 to line 14, col 33 of module random_06222
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 22 to line 14, col 79 of module random_06222
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
