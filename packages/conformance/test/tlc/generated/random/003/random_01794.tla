(*---
description: Evaluates a random seq expression, seed 262, number 1794.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01794 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SelectSeq(SubSeq(<<{1, 2}, 3>>, Cardinality({1, 2}), IF TRUE THEN 2147483647 ELSE [x \in Nat |-> x + 1]), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<{1, 2}, 3>>
    , but instead it is
    2147483647
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<{1, 2}, 3>>
    , but instead it is
    2147483647
---*)
