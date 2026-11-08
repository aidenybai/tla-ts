(*---
description: Evaluates a random int expression, seed 262, number 873.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00873 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(CASE (<<>> = (1 :> 2)) -> (2147483647 * <<3, 1, 2>>) [] OTHER -> {b1414 \in 2..1 : TRUE} - [Head(<<>>) EXCEPT !.a = Head(<<1, 2>>)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00873 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
