(*---
description: Evaluates a random int expression, seed 262, number 1975.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01975 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Append(SelectSeq(SubSeq(<<1>>, 2, 2), LAMBDA e : e > 0), (CHOOSE b3129 \in DOMAIN <<5, 6>> : (FALSE /\ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    2
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    2
---*)
