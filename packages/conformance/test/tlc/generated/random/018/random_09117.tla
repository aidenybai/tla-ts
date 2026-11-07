(*---
description: Evaluates a random seq expression, seed 262, number 9117.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09117 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SubSeq((CHOOSE r \in [a : {}] : TRUE), Head(SelectSeq(<<>>, LAMBDA e : e > 0)), CASE (2 <=> {1, 2}) -> (1..3 \subseteq 2..1) [] OTHER -> Cardinality({1, 2})), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09117 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 34 to line 14, col 61 of module random_09117
---*)
