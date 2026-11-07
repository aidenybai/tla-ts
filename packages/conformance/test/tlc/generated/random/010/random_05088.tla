(*---
description: Evaluates a random seq expression, seed 262, number 5088.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05088 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([SortSeq(<<1>>, LAMBDA p, q : p < q) EXCEPT ![1] = (2147483647 * 2147483647)] \o SelectSeq(SubSeq(<<>>, 7, 2), LAMBDA e : e > 0)) \o [Append(<<2147483647, -1>>, ([x \in 1..2 |-> x])[0]) EXCEPT ![1] = Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647*2147483647
    2178:0 Overflow when computing 2147483647*2147483647
---*)
