(*---
description: Evaluates a random seq expression, seed 262, number 3645.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03645 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((CHOOSE r \in [a : 1..2] : TRUE), LET b5761 == ([[x \in 1..2 |-> x] EXCEPT ![2147483647] = 2147483647])[Cardinality(1..3)] IN (LET b5762 == b5761 IN 7 + LET b5763 == <<3, 1, 2>> IN b5761), ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] EXCEPT !.a = @ + [a |-> 2..1, b |-> FALSE]]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 72 to line 14, col 89 of module random_03645
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03645 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)
