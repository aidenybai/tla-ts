(*---
description: Evaluates a random seq expression, seed 262, number 2539.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02539 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SubSeq([(<<1>> \o <<1, 2>>) EXCEPT ![1] = (2 - 7)], CASE (FALSE <=> FALSE) -> (CHOOSE b4002 \in {x \in 1..3 : x > 1} : FALSE) [] OTHER -> (-3), (CHOOSE b4003 \in (1 .. 2147483647) : (1 \in 1..3))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02539 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 103 to line 14, col 147 of module random_02539
---*)
