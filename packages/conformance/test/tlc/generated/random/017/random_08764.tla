(*---
description: Evaluates a random seq expression, seed 262, number 8764.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08764 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq([Append(<<>>, 2147483647) EXCEPT ![1] = (-1 * 2)], LAMBDA p, q : p < q), ((LET b13570 == 1 IN b13570 \div (0 - 2)) - (CHOOSE b13571 \in DOMAIN [x \in 1..2 |-> x] : (0 \in {x \in 1..3 : x > 1}))), ((CASE FALSE -> -1 [] OTHER -> 7 \div Head(<<1>>)) % ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08764 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 149 to line 14, col 222 of module random_08764
---*)
