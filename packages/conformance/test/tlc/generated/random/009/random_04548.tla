(*---
description: Evaluates a random set expression, seed 262, number 4548.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04548 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b7131 \in ({} \ 1..3) |-> (TRUE \/ FALSE)])[LET b7132 == (CHOOSE b7133 \in {} : TRUE) IN (b7132 * 1)] .. (-([a |-> 2147483647, b |-> FALSE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04548 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 77 to line 14, col 102 of module random_04548
---*)
