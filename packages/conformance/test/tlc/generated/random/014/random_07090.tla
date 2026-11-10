(*---
description: Evaluates a random record expression, seed 262, number 7090.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07090 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = Head([(<<3, 1, 2>> \o <<1, 2>>) EXCEPT ![1] = (<<1, 2>>).a])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07090 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
