(*---
description: Evaluates a random seq expression, seed 262, number 293.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00293 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(SelectSeq(SubSeq(<<1, 2>>, 2, 3), LAMBDA e : e > 0) \o ((<<3, 1, 2>> \o <<3, 1, 2>>) \o SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))) EXCEPT ![1] = DOMAIN [[[x \in 1..2 |-> x] EXCEPT ![[a |-> 1]] = 1] EXCEPT ![(2147483647 + 7)] = (2147483647 - [a |-> 1])]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    3
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    3
---*)
