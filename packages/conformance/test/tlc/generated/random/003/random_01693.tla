(*---
description: Evaluates a random seq expression, seed 262, number 1693.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01693 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([SelectSeq([<<3, 1, 2>> EXCEPT ![1] = [x \in Nat |-> x + 1]], LAMBDA e : e > 0) EXCEPT ![1] = Head(SortSeq(<<>>, LAMBDA p, q : p < q))], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of > should be an integer, but instead it is:
    [x \in Nat |-> <expression line 14, col 79 to line 14, col 83 of module random_01693>]
    2266:0 The first argument of > should be an integer, but instead it is:
    [x \in Nat |-> <expression line 14, col 79 to line 14, col 83 of module random_01693>]
---*)
