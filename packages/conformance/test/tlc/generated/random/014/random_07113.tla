(*---
description: Evaluates a random function expression, seed 262, number 7113.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07113 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10922 \in (((-1) * (0 \div 0)) .. Head(<<2147483647, -1>>)) |-> (CASE (TRUE \/ FALSE) -> (0 - b10922) [] OTHER -> LET b10923 == b10922 IN 7 - Head(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
