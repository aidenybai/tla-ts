(*---
description: Evaluates a random function expression, seed 262, number 9147.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09147 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] EXCEPT !.a = (CHOOSE b14211 \in {1} : TRUE)]).a :> Head(<<(2147483647 + 1), SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
