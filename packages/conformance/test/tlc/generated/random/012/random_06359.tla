(*---
description: Evaluates a random seq expression, seed 262, number 6359.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06359 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(({b9774 \in {1} : FALSE} \subseteq (3 .. 2)), LAMBDA p, q : p < q), (((7 % 7) - ([x \in 1..2 |-> x])[1]) % Len((TRUE => FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    TRUE
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    TRUE
---*)
