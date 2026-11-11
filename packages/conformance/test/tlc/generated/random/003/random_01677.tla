(*---
description: Evaluates a random function expression, seed 262, number 1677.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01677 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [2..1 -> {0} \cup {1}] : TRUE) EXCEPT ![Head(Append(SubSeq(<<>>, <<1>>, 3), (7 + 1)))] = (Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) - ((0 - 1) + [<<3, 1, 2>> EXCEPT ![1] = 2147483647]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01677 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<1>>
---*)
