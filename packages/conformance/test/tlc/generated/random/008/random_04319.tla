(*---
description: Evaluates a random seq expression, seed 262, number 4319.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04319 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(Tail(SubSeq(<<1, 2>>, 2, 7)), LAMBDA p, q : p < q), Cardinality((DOMAIN [x \in Nat |-> x + 1] \cup (1..3 \cap 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    7
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    7
---*)
