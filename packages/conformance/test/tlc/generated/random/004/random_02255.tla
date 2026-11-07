(*---
description: Evaluates a random record expression, seed 262, number 2255.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02255 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = Len((SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) \o SubSeq(<<1, 2>>, 0, 3)))])
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
