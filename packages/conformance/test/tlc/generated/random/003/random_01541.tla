(*---
description: Evaluates a random int expression, seed 262, number 1541.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01541 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2147483647 = <<3, 1, 2>>) \/ (0 < 2147483647))).a % ((([a |-> 1]).a % (7 - 2)) - ((7 + -1) - (0 * 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01541 failed.
    Attempted to check equality of integer 2147483647 with non-integer:
    <<3, 1, 2>>
---*)
