(*---
description: Evaluates a random function expression, seed 262, number 2120.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02120 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE ([a |-> 1] = [a |-> 1, b |-> TRUE]) -> (7 + 2147483647) [] OTHER -> ([a |-> 1]).a - ((-1) - ({}).a)) :> (SubSeq((7 :> 3), (2147483647 % 0), (-1 * 1)) * (-Head(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02120 failed.
    Attempted to select field "a" from a non-record value {}
    line 14, col 115 to line 14, col 120 of module random_02120
---*)
