(*---
description: Evaluates a random set expression, seed 262, number 2015.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02015 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len((SubSeq(<<1>>, 3, 3) \o SortSeq(2..1, LAMBDA p, q : p < q))) .. (((1 % 2) + (3 \div 0)) - {([x \in 1..2 |-> x])[b3194] : b3194 \in UNION {1..3, {2, 1, 3}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    3
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    3
---*)
