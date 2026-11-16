(*---
description: Evaluates a random seq expression, seed 262, number 4296.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04296 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([<<(-1 % 2147483647), Head(<<1>>)>> EXCEPT ![1] = Len([{2, 1, 3} EXCEPT ![1] = 1])] \o Tail(SelectSeq(Append(<<>>, TRUE), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04296 failed.
    Attempted to apply EXCEPT construct to the value {1, 2, 3}.
---*)
