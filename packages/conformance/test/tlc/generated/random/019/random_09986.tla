(*---
description: Evaluates a random set expression, seed 262, number 9986.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09986 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(SubSeq(Tail(<<1, 2>>), (-2147483647), (FALSE => TRUE))), IF ((-7) < Cardinality({2, 1, 3})) THEN CASE (<<3, 1, 2>> = (1 :> 2)) -> (2147483647 + 0) [] OTHER -> IF TRUE THEN 3 ELSE 3 ELSE ((2147483647 + 7) * (<<5, 6>>)[3])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    TRUE
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    TRUE
---*)
