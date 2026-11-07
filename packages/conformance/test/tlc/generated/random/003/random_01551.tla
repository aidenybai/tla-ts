(*---
description: Evaluates a random record expression, seed 262, number 1551.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01551 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~([SubSeq(<<1>>, 0, 1) EXCEPT ![1] = Len(<<1>>)] = [b2472 \in (2..1 \ 2..1) |-> (CHOOSE b2473 \in 2..1 : TRUE)])))
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
