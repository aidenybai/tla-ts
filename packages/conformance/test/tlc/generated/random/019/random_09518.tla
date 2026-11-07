(*---
description: Evaluates a random int expression, seed 262, number 9518.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09518 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (((2147483647 - 2) < [<<5, 6>> EXCEPT ![1] = -1]) => ((TRUE <=> FALSE) \/ (-1 < 0))) -> Head(Tail(<<2, 7>>)) [] OTHER -> LET b14785 == Len(Append(<<1>>, 7)) IN (CASE TRUE -> 2147483647 [] OTHER -> 1 % ([a |-> 1, b |-> TRUE]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of < should be an integer, but instead it is:
    <<-1, 6>>
    2266:0 The second argument of < should be an integer, but instead it is:
    <<-1, 6>>
---*)
