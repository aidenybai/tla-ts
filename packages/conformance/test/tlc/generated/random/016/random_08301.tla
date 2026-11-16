(*---
description: Evaluates a random set expression, seed 262, number 8301.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08301 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Head(SubSeq(<<1, 2>>, 0, 2)) .. (([a |-> 1, b |-> TRUE]).a % LET b12845 == 7 IN <<3, 1, 2>>)), Len([DOMAIN <<5, 6>> EXCEPT ![1] = LET b12846 == 0 IN {1, 2}])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08301 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    0
---*)
