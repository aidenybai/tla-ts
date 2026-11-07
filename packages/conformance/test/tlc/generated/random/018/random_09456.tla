(*---
description: Evaluates a random seq expression, seed 262, number 9456.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09456 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SelectSeq(SubSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LET b14681 == 3 IN 0, (2147483647 * 2147483647)), LAMBDA e : e > 0), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647*2147483647
    2178:0 Overflow when computing 2147483647*2147483647
---*)
