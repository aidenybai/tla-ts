(*---
description: Evaluates a random int expression, seed 262, number 1440.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01440 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SubSeq(<<CASE FALSE -> 7 [] OTHER -> 1, (0 + -1)>>, LET b2307 == CASE TRUE -> 1 [] OTHER -> 7 IN (3 + 2147483647), LET b2308 == (-1 - 0) IN (1 * b2308))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01440 failed.
    2178:0 Overflow when computing 3+2147483647
---*)
