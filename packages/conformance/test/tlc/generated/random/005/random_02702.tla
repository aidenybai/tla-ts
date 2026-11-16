(*---
description: Evaluates a random int expression, seed 262, number 2702.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02702 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 * 2147483647) - ([a |-> 1, b |-> TRUE]).a) :> ((TRUE \div 2147483647) \div (CHOOSE b4273 \in {} : FALSE))))[Len(<<Head(<<1>>), Len(<<1, 2>>)>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02702 failed.
    2178:0 Overflow when computing 3*2147483647
---*)
