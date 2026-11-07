(*---
description: Evaluates a random seq expression, seed 262, number 7195.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07195 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((SortSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA p, q : p < q) \o SortSeq(SubSeq(<<>>, 2147483647, 3), LAMBDA p, q : p < q)), LET b11055 == ((CHOOSE r \in [a : {1, 2}] : TRUE)).a IN Cardinality(DOMAIN <<5, 6>>), (CHOOSE b11056 \in ({3, 7} \cap (-1 .. 2)) : ((b11056 .. 2147483647) \subseteq {TRUE, b11056}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07195 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 238 to line 14, col 330 of module random_07195
---*)
