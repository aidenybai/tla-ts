(*---
description: Evaluates a random int expression, seed 262, number 6126.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06126 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len([Append(Tail(FALSE), CASE FALSE -> 3 [] OTHER -> 3) EXCEPT ![1] = Len(Tail(<<1>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    FALSE
    2283:0 The argument of Tail should be a sequence, but instead it is:
    FALSE
---*)
