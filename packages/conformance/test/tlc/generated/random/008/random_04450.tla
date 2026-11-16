(*---
description: Evaluates a random bool expression, seed 262, number 4450.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04450 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (~(~TRUE)) -> LET b7002 == (CHOOSE b7003 \in {1} : FALSE) IN (3 % b7002) [] OTHER -> ((1 \div 2147483647) - Cardinality({2, 1, 3})) = (([[a |-> 1] EXCEPT !.a = @ + 0]).a \div Len(Append(<<>>, 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04450 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 50 to line 14, col 77 of module random_04450
---*)
