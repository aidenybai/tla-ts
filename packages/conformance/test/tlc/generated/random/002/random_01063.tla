(*---
description: Evaluates a random set expression, seed 262, number 1063.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01063 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((Head(FALSE) % CASE FALSE -> 1 [] OTHER -> 3) * Head(<<2147483647, 7>>)), (IF (3 < 1) THEN Len(<<>>) ELSE IF FALSE THEN 2147483647 ELSE -1 - (Len(<<1>>) % CASE TRUE -> 1 [] OTHER -> 0))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01063 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
---*)
