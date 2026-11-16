(*---
description: Evaluates a random set expression, seed 262, number 2875.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02875 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b4558 == CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> (CHOOSE b4559 \in 1..3 : FALSE) [] OTHER -> (CHOOSE b4560 \in {1} : FALSE) IN Len(SubSeq(FALSE, b4558, b4558)), (Len([<<3, 1, 2>> EXCEPT ![1] = 3]) + Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02875 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 119 to line 14, col 146 of module random_02875
---*)
