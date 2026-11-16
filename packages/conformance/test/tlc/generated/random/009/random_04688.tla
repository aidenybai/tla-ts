(*---
description: Evaluates a random bool expression, seed 262, number 4688.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04688 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b7326 \in {((1 + -1) \div Len(<<3, 1, 2>>)), LET b7327 == (3 % -1) IN IF FALSE THEN 3 ELSE b7327} : DOMAIN [b7328 \in (b7326 .. 1) |-> Head(b7328)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04688 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
