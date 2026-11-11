(*---
description: Evaluates a random seq expression, seed 262, number 6660.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06660 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq(SortSeq((<<>> \o <<>>), LAMBDA p, q : p < q), ((CHOOSE b10219 \in {x \in 1..3 : x > 1} : FALSE) * Cardinality({x \in 1..3 : x > 1})), (([a |-> 1]).a * Cardinality({1}))), Head(Tail(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))), (((CHOOSE r \in [a : {1, 2}] : TRUE)).a + (-({1, 2}).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06660 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 78 to line 14, col 123 of module random_06660
---*)
