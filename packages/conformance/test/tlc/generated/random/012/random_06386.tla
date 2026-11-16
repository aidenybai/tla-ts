(*---
description: Evaluates a random set expression, seed 262, number 6386.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06386 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {}] : TRUE) \cap ({b9820 \in (3 .. 0) : ([a |-> 1] = [a |-> 1])} \ ({b9821 : b9821 \in {1, 2}} \ UNION {{1}, Nat}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06386 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 45 of module random_06386
---*)
