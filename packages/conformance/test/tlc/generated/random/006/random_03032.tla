(*---
description: Evaluates a random record expression, seed 262, number 3032.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03032 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(((<<>> \o <<1>>) \o SelectSeq(<<1>>, LAMBDA e : e > 0)), ((1 % 7) + (2 % 0))) \o SelectSeq(<<(2 \div 3), (0 - -1)>>, LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03032 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
