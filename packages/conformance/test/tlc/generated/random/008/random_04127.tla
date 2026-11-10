(*---
description: Evaluates a random int expression, seed 262, number 4127.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04127 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Tail(Append((<<>> \o <<>>), (2147483647 % 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04127 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
