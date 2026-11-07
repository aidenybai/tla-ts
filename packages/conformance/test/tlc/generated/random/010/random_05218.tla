(*---
description: Evaluates a random seq expression, seed 262, number 5218.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05218 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<Len([<<1>> EXCEPT ![1] = -1]), ((7 - -1) \div (3 - 3))>> \o SortSeq([Tail(<<>>) EXCEPT ![1] = CASE TRUE -> (1 :> 2) [] OTHER -> 3], LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
