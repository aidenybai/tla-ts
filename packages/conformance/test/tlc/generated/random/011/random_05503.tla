(*---
description: Evaluates a random seq expression, seed 262, number 5503.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05503 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(<<Len((<<3, 1, 2>> \o <<1>>)), [[[x \in Nat |-> x + 1] EXCEPT ![-1] = 7] EXCEPT ![([a |-> 1, b |-> TRUE]).a] = LET b8505 == 1 IN 1]>>, LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 59 to line 14, col 79 of module random_05503
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05503 failed.
    2266:0 The first argument of > should be an integer, but instead it is:
    [x \in Nat |-> <expression line 14, col 74 to line 14, col 78 of module random_05503>]
---*)
