(*---
description: Evaluates a random int expression, seed 262, number 1064.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01064 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0] EXCEPT !.a = @ + (2 - 2147483647)] EXCEPT !.a = Head(Append(<<>>, TRUE))] * (LET b1703 == ([a |-> 1, b |-> TRUE]).a IN LET b1704 == 3 IN b1703 \div (CHOOSE b1705 \in UNION {1..3, 1..3} : ({} = SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01064 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 211 to line 14, col 265 of module random_01064
---*)
