(*---
description: Evaluates a random seq expression, seed 262, number 8542.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08542 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SubSeq(SortSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA p, q : p < q), (([x \in Nat |-> x + 1])[2147483647] % (7 - 7)), Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
