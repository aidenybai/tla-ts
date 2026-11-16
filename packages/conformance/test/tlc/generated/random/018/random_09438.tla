(*---
description: Evaluates a random seq expression, seed 262, number 9438.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09438 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Tail([[1 EXCEPT ![1] = 3] EXCEPT ![1] = Head(<<1>>)]), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09438 failed.
    Attempted to apply EXCEPT construct to the value 1.
---*)
