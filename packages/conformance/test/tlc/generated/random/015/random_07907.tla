(*---
description: Evaluates a random seq expression, seed 262, number 7907.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07907 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq(<<(7 \div 0), ((1 :> 2))[3]>>, (Head(<<3, 1, 2>>) % Len(<<>>)), (Len(<<>>) * Head(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07907 failed.
    2179:0 The second argument of \div is 0.
---*)
