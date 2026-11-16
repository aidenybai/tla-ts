(*---
description: Evaluates a random function expression, seed 262, number 1326.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01326 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b2122 \in ({(3 * 1), ([a |-> 1]).a} \ [[<<>> EXCEPT !.a = @ + 0] EXCEPT !.a = @ + Head(<<3, 1, 2>>)]) |-> IF ((<<3, 1, 2>> \o <<1, 2>>) < (b2122 \div 3)) THEN LET b2123 == ([a |-> 1]).a IN LET b2124 == b2122 IN b2123 ELSE (-IF FALSE THEN b2122 ELSE 0)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01326 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
