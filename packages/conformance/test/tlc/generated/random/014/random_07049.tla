(*---
description: Evaluates a random int expression, seed 262, number 7049.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07049 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] EXCEPT !.a = LET b10815 == -1 IN b10815] EXCEPT !.a = @ + ((2147483647 + 2) + CASE TRUE -> 1 [] OTHER -> 2147483647)]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+2
    2178:0 Overflow when computing 2147483647+2
---*)
