(*---
description: Evaluates a random bool expression, seed 262, number 7763.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07763 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[b11969 \in SubSeq(<<3, 1, 2>>, -1, 0) |-> (b11969 % b11969)] EXCEPT ![(((1 :> 2))[-1] % (-3))] = ([[a |-> 1] EXCEPT !.a = -1]).a] <=> (Head(<<2, -1>>) < ((CHOOSE f \in [{1} -> {2, 1, 3}] : TRUE))[(7 - 7)])))
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
