(*---
description: Evaluates a random record expression, seed 262, number 209.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00209 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> LET b342 == 3 IN b342, b |-> (\A b343 \in SUBSET {1} : FALSE)] EXCEPT !.a = @ + Head(SortSeq(<<1>>, LAMBDA p, q : p < q))] EXCEPT !.a = IF ((-1 < 7) <=> ([a |-> 1] = [a |-> 1])) THEN ((CHOOSE r \in [a : 2..1] : TRUE)).a ELSE ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00209 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 210 to line 14, col 239 of module random_00209
---*)
