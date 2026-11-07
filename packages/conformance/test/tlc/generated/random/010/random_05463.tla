(*---
description: Evaluates a random seq expression, seed 262, number 5463.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05463 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq((SelectSeq(<<1, 2>>, LAMBDA e : e > 0) \o (<<3, 1, 2>> \o <<1>>)), ([a |-> FALSE, b |-> FALSE]).a, Head(SubSeq(<<1, 2>>, 1, 3))) EXCEPT ![1] = (((CHOOSE r \in [a : {1, 2}] : TRUE)).a % ([[a |-> 1] EXCEPT !.a = 0]).a)])
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
