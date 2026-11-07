(*---
description: Evaluates a random seq expression, seed 262, number 2233.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02233 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([SubSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), Cardinality({}), (<<5, 6>>)[2]) EXCEPT ![1] = (CHOOSE b3510 \in UNION {{}, {1}} : (-3))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    0
---*)
