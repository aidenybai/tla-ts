(*---
description: Evaluates a random set expression, seed 262, number 7768.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07768 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len([LET b11984 == 7 IN FALSE EXCEPT ![1] = (-3)]) .. (<<Head(<<3, 1, 2>>), SelectSeq(7, LAMBDA e : e > 0)>> \div Len(Tail(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07768 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
