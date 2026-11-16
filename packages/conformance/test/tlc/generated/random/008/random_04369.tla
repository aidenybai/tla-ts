(*---
description: Evaluates a random int expression, seed 262, number 4369.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04369 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (<<>> \o <<3, 1, 2>>) -> (-1 * 0) [] OTHER -> (0 + -1) % IF ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) THEN Head(<<3, 1, 2>>) ELSE (-0)) % (IF (~FALSE) THEN IF TRUE THEN -1 ELSE 7 ELSE ([x \in Nat |-> x + 1])[1] % ([[a |-> 1] EXCEPT !.a = @ + -1]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04369 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 24 to line 14, col 42 of module random_04369
---*)
