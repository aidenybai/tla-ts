(*---
description: Evaluates a random seq expression, seed 262, number 9216.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09216 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Tail(<<LET b14303 == 1 IN b14303, Append(<<1, 2>>, 2)>>), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09216 failed.
    2266:0 The first argument of > should be an integer, but instead it is:
    <<1, 2, 2>>
---*)
