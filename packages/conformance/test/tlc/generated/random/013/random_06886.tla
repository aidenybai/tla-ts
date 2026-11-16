(*---
description: Evaluates a random seq expression, seed 262, number 6886.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06886 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append(SubSeq(Tail(<<1>>), Cardinality({1, 2}), Head(SUBSET {1})), Cardinality(({x \in 1..3 : x > 1} \cup SUBSET {1}))), SubSeq(Tail(SelectSeq(<<1>>, LAMBDA e : e > 0)), Len(SortSeq(Nat, LAMBDA p, q : p < q)), (Cardinality({2, 1, 3}) - Len(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06886 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    {{}, {1}}
---*)
