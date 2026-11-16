(*---
description: Evaluates a random int expression, seed 262, number 9598.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09598 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (\A b14904 \in SelectSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), LAMBDA e : e > 0) : ((b14904 % 2147483647) \in DOMAIN <<5, 6>>)) THEN (Cardinality(DOMAIN <<5, 6>>) - Cardinality((Nat \cap {1, 2}))) ELSE CASE ((0 % 2147483647) < Head(<<>>)) -> ((7 % 0) \div (2147483647 - 2147483647)) [] OTHER -> (-(-7)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09598 failed.
    TLC encountered a non-enumerable quantifier bound
    <<1, 2, 3>>.
    line 14, col 34 to line 14, col 103 of module random_09598
---*)
