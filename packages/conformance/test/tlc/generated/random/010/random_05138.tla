(*---
description: Evaluates a random function expression, seed 262, number 5138.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05138 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] EXCEPT !.a = Head(<<>>)]).a :> Head(Append(SortSeq(<<>>, LAMBDA p, q : p < q), LET b7981 == 3 IN b7981))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
