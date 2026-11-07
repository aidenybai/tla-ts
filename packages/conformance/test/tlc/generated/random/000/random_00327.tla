(*---
description: Evaluates a random int expression, seed 262, number 327.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00327 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b549 == (-(IF FALSE THEN 7 ELSE 2147483647 - Len(<<>>))) IN (LET b550 == IF TRUE THEN b549 ELSE b549 IN (b549 * b549) - (-(7 * 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing -2147483647*-2147483647
    2178:0 Overflow when computing -2147483647*-2147483647
---*)
