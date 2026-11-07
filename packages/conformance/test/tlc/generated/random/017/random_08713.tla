(*---
description: Evaluates a random int expression, seed 262, number 8713.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08713 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head((SubSeq(<<3, 1, 2>>, 0, 3) \o <<1, 7>>)) * LET b13491 == LET b13492 == [a |-> 0, b |-> <<>>] IN LET b13493 == -1 IN b13492 IN (CHOOSE b13494 \in DOMAIN (1 :> 2) : ({2, 1, 3} = 2..1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    0
---*)
