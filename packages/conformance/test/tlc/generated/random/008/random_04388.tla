(*---
description: Evaluates a random int expression, seed 262, number 4388.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04388 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Append(Tail(<<0, -1>>), (Head(<<>>) \div (-1 + 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04388 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
