(*---
description: Evaluates a random int expression, seed 262, number 345.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00345 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([SelectSeq(<<2, 2147483647>>, LAMBDA e : e > 0) EXCEPT ![(-Cardinality({2, 1, 3}))] = ((-7) - Cardinality({x \in 1..3 : x > 1}))])[(CASE (2147483647 = 3) -> Len(<<3, 1, 2>>) [] OTHER -> (2 \div 1) % Head(Tail(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 63 of module random_00345
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00345 failed.
    Attempted to access index 0 of tuple
    <<2, 2147483647>>
    which is out of bounds.
---*)
