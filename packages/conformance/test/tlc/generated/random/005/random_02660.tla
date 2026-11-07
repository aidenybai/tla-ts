(*---
description: Evaluates a random seq expression, seed 262, number 2660.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02660 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Append(SelectSeq(<<0, TRUE>>, LAMBDA e : e > 0), Len(<<-1, 7>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of > should be an integer, but instead it is:
    TRUE
    2266:0 The first argument of > should be an integer, but instead it is:
    TRUE
---*)
