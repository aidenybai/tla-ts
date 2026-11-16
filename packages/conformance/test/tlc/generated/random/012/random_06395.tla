(*---
description: Evaluates a random seq expression, seed 262, number 6395.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06395 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE ((FALSE <=> FALSE) /\ (0 < 0)) -> (Head(<<1, 2>>) + (CHOOSE b9839 \in 1..3 : TRUE)) [] OTHER -> Cardinality(UNION {1..3, {x \in 1..3 : x > 1}}), ([a |-> (CHOOSE b9840 \in {} : FALSE), b |-> (<<1>> = (1 :> 2))]).a>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06395 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 177 to line 14, col 203 of module random_06395
---*)
