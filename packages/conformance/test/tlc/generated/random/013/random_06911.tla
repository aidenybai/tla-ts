(*---
description: Evaluates a random int expression, seed 262, number 6911.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06911 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (TRUE \/ TRUE) THEN SubSeq(<<3, 1, 2>>, -1, 1) ELSE Len(<<1>>) - ((-7) * (2147483647 - 0))) * Len((SortSeq(<<1, 2>>, LAMBDA p, q : p < q) \o SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    -1
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    -1
---*)
