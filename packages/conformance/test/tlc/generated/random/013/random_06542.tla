(*---
description: Evaluates a random int expression, seed 262, number 6542.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06542 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<((0 + 3) + (2147483647 \div 2)), (CHOOSE f \in [{} -> {1, 2}] : TRUE)>> % (Len(SortSeq(<<1>>, LAMBDA p, q : p < q)) * ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
