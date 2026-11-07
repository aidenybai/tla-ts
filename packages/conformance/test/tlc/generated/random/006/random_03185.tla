(*---
description: Evaluates a random int expression, seed 262, number 3185.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03185 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({CASE (TRUE = [x \in Nat |-> x + 1]) -> (0 + 2147483647) [] OTHER -> ([x \in Nat |-> x + 1])[0], LET b5067 == (-2) IN Len(<<1, 2>>)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03185 failed.
    Attempted to compare equality of boolean TRUE with non-boolean:
    [x \in Nat |-> <expression line 14, col 57 to line 14, col 61 of module random_03185>]
---*)
