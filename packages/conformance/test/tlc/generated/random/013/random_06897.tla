(*---
description: Evaluates a random int expression, seed 262, number 6897.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06897 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b10562 == ((-(2 \div 1)) - (CASE TRUE -> 2147483647 [] OTHER -> 0 % (2147483647 % 2147483647))) IN IF (~(TRUE => TRUE)) THEN (-(2147483647 + b10562)) ELSE Head(SubSeq(<<3, 1, 2>>, b10562, b10562)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06897 failed.
    2178:0 Overflow when computing -2-2147483647
---*)
