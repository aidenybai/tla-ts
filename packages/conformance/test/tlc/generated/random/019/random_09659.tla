(*---
description: Evaluates a random seq expression, seed 262, number 9659.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09659 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq([SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = Cardinality({x \in 1..3 : x > 1})], LAMBDA e : e > 0) EXCEPT ![1] = ((IF FALSE THEN -1 ELSE [a |-> 1, b |-> TRUE] * ([a |-> 1]).a) % (IF FALSE THEN 2 ELSE 2 + (-1 \div 0)))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 28 to line 14, col 61 of module random_09659
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 129 of module random_09659
    | <<>>
---*)
