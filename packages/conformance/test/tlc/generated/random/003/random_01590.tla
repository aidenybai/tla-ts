(*---
description: Evaluates a random seq expression, seed 262, number 1590.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01590 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((7 + -1) + LET b2539 == 1 IN b2539) \in UNION {{-1 : b2540 \in 1..3}, {b2541 : b2541 \in {2, 1, 3}}}) EXCEPT ![1] = ((LET b2542 == 1 IN 2 * ([a |-> 1]).a) - (Head(<<1>>) + CASE FALSE -> 0 [] OTHER -> -1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01590 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
