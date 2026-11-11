(*---
description: Evaluates a random int expression, seed 262, number 5945.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05945 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len([SelectSeq(Tail(<<>>), LAMBDA e : e > 0) EXCEPT ![1] = Len(Tail(<<3, 1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05945 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
