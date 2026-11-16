(*---
description: Evaluates a random set expression, seed 262, number 7779.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07779 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b12001 \in {Head(<<1>>) : b12002 \in (0 % 3)} : ((0 + 2147483647) \in (b12001 .. -1))) .. Head(Tail((<<>> \o <<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07779 failed.
    TLC encountered a non-enumerable quantifier bound
    0.
    line 14, col 63 to line 14, col 67 of module random_07779
---*)
