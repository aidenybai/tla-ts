(*---
description: Evaluates a random int expression, seed 262, number 6130.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06130 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((IF TRUE THEN 3 ELSE 0 % IF FALSE THEN 3 ELSE 0) < (CHOOSE b9427 \in Head(<<1>>) : (b9427 < b9427))) THEN (LET b9428 == (0 - 2) IN (~TRUE) - Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))) ELSE (Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) * ((1 * 3) - ([a |-> 1]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06130 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 72 to line 14, col 117 of module random_06130
---*)
