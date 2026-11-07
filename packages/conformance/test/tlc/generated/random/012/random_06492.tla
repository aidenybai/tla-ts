(*---
description: Evaluates a random function expression, seed 262, number 6492.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06492 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9981 \in {(-(3 % 0)), Len(SelectSeq(1, LAMBDA e : e > 0))} |-> IF ([[a |-> 1] EXCEPT !.a = -1] <=> (b9981 \in Nat)) THEN (LET b9982 == 7 IN b9982 + ({1, 2} @@ [x \in Nat |-> x + 1])) ELSE Cardinality({b9981, 7})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
