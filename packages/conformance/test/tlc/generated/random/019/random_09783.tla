(*---
description: Evaluates a random record expression, seed 262, number 9783.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09783 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b15190 \in SelectSeq(Head(Tail(<<3, 1, 2>>)), LAMBDA e : e > 0) : (~((b15190 + 7) = CASE FALSE -> b15190 [] OTHER -> 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    1
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    1
---*)
