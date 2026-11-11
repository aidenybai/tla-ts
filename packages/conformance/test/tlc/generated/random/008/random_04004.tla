(*---
description: Evaluates a random int expression, seed 262, number 4004.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04004 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 * 2147483647) % ([a |-> 1]).a) + Head(SubSeq(<<1>>, 3, 3))) \div (LET b6292 == ([a |-> 1]).a IN Head(<<3, 1, 2>>) % Head(SubSeq(<<1, 2>>, {1}, 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04004 failed.
    2178:0 Overflow when computing 3*2147483647
---*)
