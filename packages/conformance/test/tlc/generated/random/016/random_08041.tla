(*---
description: Evaluates a random seq expression, seed 262, number 8041.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08041 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([SelectSeq(SubSeq(<<1>>, 0, 3), LAMBDA e : e > 0) EXCEPT ![1] = IF (1 \in {1, 2}) THEN (<<3, 1, 2>> * 7) ELSE (0 - 2147483647)] \o Tail(<<(<<5, 6>>)[2147483647], (2 = 1)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    0
---*)
