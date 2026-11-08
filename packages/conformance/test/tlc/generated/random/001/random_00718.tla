(*---
description: Evaluates a random seq expression, seed 262, number 718.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00718 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(SortSeq(SubSeq(<<1>>, [x \in Nat |-> x + 1], 1), LAMBDA p, q : p < q), LET b1183 == Cardinality({x \in 1..3 : x > 1}) IN Len(<<1, 2>>)) EXCEPT ![1] = CASE (\E b1184 \in (\E b1185 \in {1} : FALSE) : (<<1>> = [x \in 1..2 |-> x])) -> ([[a |-> 1] EXCEPT !.a = 3]).a [] OTHER -> (-(7 + 7))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00718 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    [x \in Nat |-> <expression line 14, col 61 to line 14, col 65 of module random_00718>]
---*)
