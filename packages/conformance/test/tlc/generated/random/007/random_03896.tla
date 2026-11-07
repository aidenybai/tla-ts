(*---
description: Evaluates a random seq expression, seed 262, number 3896.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03896 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(((<<3, 7>> \o SortSeq(<<1, 2>>, LAMBDA p, q : p < q)) \o [SubSeq(<<1>>, 0, 1) EXCEPT ![1] = [[a |-> 1] EXCEPT !.a = [x \in 1..2 |-> x]]])))
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
