(*---
description: Evaluates a random int expression, seed 262, number 1386.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01386 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1] EXCEPT !.a = @ + -1] EXCEPT !.a = (0 \div 0)] EXCEPT !.a = IF ([x \in 1..2 |-> x] \/ TRUE) THEN Head(<<>>) ELSE Head(<<1, 2>>)]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01386 failed.
    2179:0 The second argument of \div is 0.
---*)
