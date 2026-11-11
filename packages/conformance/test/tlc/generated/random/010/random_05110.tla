(*---
description: Evaluates a random set expression, seed 262, number 5110.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05110 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b7948 \in ({SortSeq(<<>>, LAMBDA p, q : p < q), (3 * 2147483647)} \ (UNION {1..3, [x \in 1..2 |-> x]} \cap (3 .. 2))) : ({(b7948 % -1), Head(<<3, 1, 2>>)} = (Head(<<1>>) .. IF FALSE THEN b7948 ELSE b7948))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05110 failed.
    2178:0 Overflow when computing 3*2147483647
---*)
