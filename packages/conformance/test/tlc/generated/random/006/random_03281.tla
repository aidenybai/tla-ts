(*---
description: Evaluates a random seq expression, seed 262, number 3281.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03281 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<([[a |-> 1] EXCEPT !.a = <<>>]).a, Head((<<1>> \o <<1, 2>>))>> \o [[SelectSeq(<<1>>, LAMBDA e : e > 0) EXCEPT ![1] = Head(FALSE)] EXCEPT ![1] = Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03281 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
---*)
