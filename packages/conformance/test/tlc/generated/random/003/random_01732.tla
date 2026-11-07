(*---
description: Evaluates a random function expression, seed 262, number 1732.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01732 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head([SelectSeq(<<>>, LAMBDA e : e > 0) EXCEPT ![1] = Head(<<1>>)]) :> (CASE (<<5, 6>> = {x \in 1..3 : x > 1}) -> Len(<<1>>) [] OTHER -> LET b2754 == 3 IN 3 % LET b2755 == (3 \div 3) IN (-2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 23 to line 14, col 55 of module random_01732
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
