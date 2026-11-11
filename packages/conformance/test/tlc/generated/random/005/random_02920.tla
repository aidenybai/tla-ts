(*---
description: Evaluates a random int expression, seed 262, number 2920.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02920 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head((((<<1>> \o <<>>) \o [<<1>> EXCEPT ![1] = 7]) \o (SubSeq(<<3, 1, 2>>, 1, 3) \o Tail(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02920 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
