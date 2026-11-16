(*---
description: Evaluates a random int expression, seed 262, number 1203.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01203 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b1933 \in (UNION {{b1934 \in {x \in 1..3 : x > 1} : FALSE}, {b1935 : b1935 \in {}}} \cup UNION {(2 .. 1), {0, 2}}) : ((~(TRUE => FALSE)) <=> ((\A b1936 \in 1..3 : TRUE) => (b1933 \in {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01203 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 17 to line 14, col 211 of module random_01203
---*)
