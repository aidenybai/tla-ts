(*---
description: Evaluates a random seq expression, seed 262, number 5700.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05700 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(Tail(SubSeq(<<1>>, 2, 7))) \o Len(((<<3, 1, 2>> \o <<1>>) \o SubSeq(<<>>, 2, SUBSET {1})))))
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
