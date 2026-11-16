(*---
description: Evaluates a random int expression, seed 262, number 5809.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05809 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((SubSeq(<<1, 2>>, 7, 2)).a \div ([[a |-> 1] EXCEPT !.a = -1]).a) * LET b8954 == IF (~FALSE) THEN (2147483647 % 1) ELSE LET b8955 == 2147483647 IN b8955 IN (Cardinality(b8954) * Head(<<>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05809 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
