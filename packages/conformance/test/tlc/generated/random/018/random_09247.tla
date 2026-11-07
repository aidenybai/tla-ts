(*---
description: Evaluates a random bool expression, seed 262, number 9247.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09247 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b14357 \in DOMAIN (CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE) : ((3 = b14357) <=> (1..3 = {1, 2}))) <=> ((SubSeq(<<>>, <<1, 2>>, 3) = (CHOOSE f \in [{1, 2} -> {}] : TRUE)) /\ ((1 + <<>>) \in (CHOOSE b14358 \in 1..3 : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<1, 2>>
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<1, 2>>
---*)
