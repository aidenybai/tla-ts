(*---
description: Evaluates a random seq expression, seed 262, number 9613.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09613 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(SelectSeq([<<3, 1, 2>> EXCEPT ![1] = 2147483647], LAMBDA e : e > 0) \o SubSeq((<<>> \o TRUE), Tail(<<1>>), (-1 \div TRUE))) EXCEPT ![1] = Len([(<<3, 1, 2>> \o <<>>) EXCEPT ![1] = (7 + 7)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09613 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    TRUE
---*)
