(*---
description: Evaluates a random function expression, seed 262, number 5720.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05720 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SelectSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA e : e > 0)) :> ([Tail(<<1>>) EXCEPT !.a = @ + CASE FALSE -> 7 [] OTHER -> 1]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05720 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
