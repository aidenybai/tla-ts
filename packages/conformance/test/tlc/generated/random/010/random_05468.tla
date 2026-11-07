(*---
description: Evaluates a random function expression, seed 262, number 5468.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05468 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(SubSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), (7 - 1), (0 * 0)), LAMBDA p, q : p < q), (CHOOSE b8460 \in {Head(<<3, 1, 2>>) : b8461 \in {b8462 : b8462 \in {}}} : (([a |-> 1, b |-> TRUE] = [x \in 1..2 |-> x]) => (b8460 = b8460)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05468 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 122 to line 14, col 260 of module random_05468
---*)
