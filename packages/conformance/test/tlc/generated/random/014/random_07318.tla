(*---
description: Evaluates a random set expression, seed 262, number 7318.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07318 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN Append(SubSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), Head(<<1>>), (3 - 0)), LET b11266 == (2147483647 + 3) IN CASE [x \in Nat |-> x + 1] -> 2 [] OTHER -> 3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07318 failed.
    A non-boolean expression (a function of the form  [x \in S |-> expr]) was used as a condition of a CASE. line 14, col 142 to line 14, col 162 of module random_07318
---*)
