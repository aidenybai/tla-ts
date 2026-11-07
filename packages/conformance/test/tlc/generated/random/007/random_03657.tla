(*---
description: Evaluates a random seq expression, seed 262, number 3657.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03657 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<[<<2, 0>> EXCEPT ![1] = CASE FALSE -> 7 [] OTHER -> 7], Cardinality(UNION {{x \in 1..3 : x > 1}, 1..3})>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of < should be an integer, but instead it is:
    <<7, 0>>
    2266:0 The second argument of < should be an integer, but instead it is:
    <<7, 0>>
---*)
