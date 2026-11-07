(*---
description: Evaluates a random set expression, seed 262, number 5469.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05469 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(([b8463 \in {2, 1, 3} |-> 1])[(2147483647 % 3)] - (([a |-> 1]).a + (7 % 3))), Head([SelectSeq(<<>>, LAMBDA e : e > 0) EXCEPT ![1] = CASE FALSE -> 2147483647 [] OTHER -> 1])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 102 to line 14, col 134 of module random_05469
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
