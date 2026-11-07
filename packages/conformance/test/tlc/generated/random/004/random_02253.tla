(*---
description: Evaluates a random seq expression, seed 262, number 2253.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02253 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SelectSeq([Append(<<3, 1, 2>>, [a |-> 1]) EXCEPT ![1] = CASE TRUE -> <<3, 1, 2>> [] OTHER -> 7], LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of > should be an integer, but instead it is:
    <<3, 1, 2>>
    2266:0 The first argument of > should be an integer, but instead it is:
    <<3, 1, 2>>
---*)
