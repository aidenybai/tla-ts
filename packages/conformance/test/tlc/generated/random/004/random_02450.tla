(*---
description: Evaluates a random bool expression, seed 262, number 2450.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02450 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b3862 == Head(SelectSeq(<<1>>, LAMBDA e : e > 0)) IN (({2, 1, 3} \cup {})).a = Head((SubSeq(<<3, 1, 2>>, 3, 2) \o <<2147483647, 1>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02450 failed.
    Attempted to select field "a" from a non-record value {1, 2, 3}
    line 14, col 74 to line 14, col 96 of module random_02450
---*)
