(*---
description: Evaluates a random seq expression, seed 262, number 1113.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01113 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append(SelectSeq(<<[x \in 1..2 |-> x], 2>>, LAMBDA e : e > 0), Head([<<1, 2>> EXCEPT ![1] = 0])), Head(Append(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), (CHOOSE b1777 \in Nat : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01113 failed.
    2266:0 The first argument of > should be an integer, but instead it is:
    <<1, 2>>
---*)
