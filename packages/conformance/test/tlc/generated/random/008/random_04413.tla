(*---
description: Evaluates a random seq expression, seed 262, number 4413.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04413 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Cardinality((Len(<<1, 2>>) .. (CHOOSE b6946 \in 1..3 : FALSE))), (CHOOSE b6947 \in ({2147483647, 1} \ UNION {{}, {2, 1, 3}}) : ((b6947 = 0) <=> ([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1])))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04413 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 49 to line 14, col 77 of module random_04413
---*)
