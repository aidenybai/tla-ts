(*---
description: Evaluates a random seq expression, seed 262, number 0.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00000 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Append(Tail(<<7, 2147483647>>), (\E b1 \in DOMAIN (1 :> 2) : (FALSE => TRUE))), LAMBDA e : e > 0))
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
