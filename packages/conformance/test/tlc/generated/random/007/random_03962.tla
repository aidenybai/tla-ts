(*---
description: Evaluates a random set expression, seed 262, number 3962.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03962 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(SortSeq(SubSeq(<<3, 1, 2>>, 1, 7), LAMBDA p, q : p < q)), (Cardinality((Nat \ {})) .. ((\A b6235 \in 1..3 : TRUE) + IF {x \in 1..3 : x > 1} THEN -1 ELSE 2))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    7
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    7
---*)
