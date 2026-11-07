(*---
description: Evaluates a random seq expression, seed 262, number 1425.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01425 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(Tail([<<1>> EXCEPT ![1] = 7]), CASE (TRUE <=> FALSE) -> (<<5, 6>>)[3] [] OTHER -> (3 = 7), Cardinality({1, 0})), IF (([a |-> 1] = [a |-> 1]) /\ (1..3 = {x \in 1..3 : x > 1})) THEN Head(SubSeq(<<1, 2>>, 2, 3)) ELSE ((2147483647 \div 2) * (3 - 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    FALSE
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    FALSE
---*)
