(*---
description: Evaluates a random int expression, seed 262, number 748.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00748 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((~(2147483647 \in 2..1)) <=> (~(\E b1227 \in {} : FALSE))) THEN Len(SubSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), (2147483647 + 2), (0 - 3))) ELSE (-LET b1228 == (7 * 2) IN (b1228 + b1228)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00748 failed.
    2178:0 Overflow when computing 2147483647+2
---*)
