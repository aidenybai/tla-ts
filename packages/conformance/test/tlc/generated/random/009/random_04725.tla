(*---
description: Evaluates a random int expression, seed 262, number 4725.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04725 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b7386 == (-(-1 + 7)) IN (IF FALSE THEN 0 ELSE 1 - (1 + 2147483647)) \div Len(SelectSeq(Tail(<<>>), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
