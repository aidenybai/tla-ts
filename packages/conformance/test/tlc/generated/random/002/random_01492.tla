(*---
description: Evaluates a random bool expression, seed 262, number 1492.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01492 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((b2385 \div 0) - Head(<<3, 1, 2>>)) : b2385 \in (LET b2386 == 2 IN b2386 .. (7 * 3))} \/ (IF (-1 = 1) THEN ([a |-> 1, b |-> TRUE]).a ELSE (CHOOSE b2387 \in 1..3 : FALSE) < Len(SubSeq(<<1, 2>>, [a |-> 1, b |-> TRUE], 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01492 failed.
    2179:0 The second argument of \div is 0.
---*)
