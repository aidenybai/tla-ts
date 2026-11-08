(*---
description: Evaluates a random seq expression, seed 262, number 4467.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04467 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((Head(<<1, 2>>) * ([a |-> 1]).a) * ((2147483647 - -1) % (7 + 2147483647))), (-(LET b7029 == 1 IN 2147483647 - (2147483647 - 2)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04467 failed.
    2178:0 Overflow when computing 2147483647--1
---*)
