(*---
description: Evaluates a random seq expression, seed 262, number 5835.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05835 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<IF (FALSE /\ FALSE) THEN (2147483647 % 7) ELSE (CHOOSE b8994 \in {1, 2} : FALSE), (CHOOSE b8995 \in {b8996 \in {} : FALSE} : (\E b8997 \in {1, 2} : FALSE))>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05835 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 74 to line 14, col 104 of module random_05835
---*)
