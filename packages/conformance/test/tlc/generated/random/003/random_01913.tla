(*---
description: Evaluates a random seq expression, seed 262, number 1913.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01913 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(Tail(Append(<<1>>, 7))) \o (Append(Append(<<1, 2>>, 2147483647), (0 % 0)) \o <<[(1 :> 2) EXCEPT ![2147483647] = -1], Head(<<1>>)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01913 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
