(*---
description: Evaluates a random bool expression, seed 262, number 9293.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09293 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(Tail(<<-1, [a |-> 1]>>), LAMBDA e : e > 0) EXCEPT ![1] = LET b14423 == (CASE TRUE -> 2147483647 [] OTHER -> 7 % [[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]) IN Len(Tail(<<1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09293 failed.
    2266:0 The first argument of > should be an integer, but instead it is:
    [a |-> 1]
---*)
