(*---
description: Evaluates a random seq expression, seed 262, number 8057.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08057 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(((Tail(<<3, 1, 2>>) \o (<<1>> \o <<3, 1, 2>>)) \o SubSeq([<<1>> EXCEPT ![1] = 7], (3 % 1), (1 % 1))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<7>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<7>>
    , but instead it is
    0
---*)
