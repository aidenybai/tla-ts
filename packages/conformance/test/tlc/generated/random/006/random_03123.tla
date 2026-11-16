(*---
description: Evaluates a random int expression, seed 262, number 3123.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03123 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SubSeq(<<1, 2>>, 0, 2147483647)) - (-Len(<<3, 1, 2>>))) * Len((SelectSeq(<<1, 2>>, LAMBDA e : e > 0) \o (-1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03123 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    0
---*)
