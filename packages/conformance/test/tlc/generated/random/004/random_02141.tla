(*---
description: Evaluates a random int expression, seed 262, number 2141.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02141 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Append((SubSeq(<<3, 1, 2>>, 2147483647, 1) \o Append(<<1, 2>>, 0)), ((1 + 2147483647) * (-1 \div 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
