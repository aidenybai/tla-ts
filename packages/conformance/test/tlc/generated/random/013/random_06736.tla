(*---
description: Evaluates a random int expression, seed 262, number 6736.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06736 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SelectSeq(SelectSeq(SubSeq(<<1>>, 1, 2147483647), LAMBDA e : e > 0), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06736 failed.
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    2147483647
---*)
