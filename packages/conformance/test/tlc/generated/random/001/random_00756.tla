(*---
description: Evaluates a random seq expression, seed 262, number 756.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00756 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SelectSeq(SelectSeq(Append(<<>>, -1), LAMBDA e : e > 0), LAMBDA e : e > 0), IF (SubSeq(<<>>, 0, -1) = [(1 :> 2) EXCEPT ![-1] = 3]) THEN (Len(<<>>) * Head(<<1>>)) ELSE (Cardinality({}) - (-0)), (((CHOOSE r \in [a : 1..2] : TRUE)).a - CASE (\E b1239 \in {1} : FALSE) -> (-1 * 2147483647) [] OTHER -> [TRUE EXCEPT ![FALSE] = 7])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 127 to line 14, col 132 of module random_00756
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00756 failed.
    Attempted to apply EXCEPT construct to the value TRUE.
---*)
