(*---
description: Evaluates a random int expression, seed 262, number 1598.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01598 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Append(Append([<<1, 2>> EXCEPT ![1] = 3], Len(<<1>>)), (Head(<<>>) + LET b2555 == 2147483647 IN 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01598 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
