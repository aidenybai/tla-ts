(*---
description: Evaluates a random set expression, seed 262, number 4247.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04247 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Head((<<3, 1, 2>> \o <<3, 1, 2>>)), (-Head(<<1, 2>>))} \cap (LET b6683 == (2147483647 - 2) IN IF TRUE THEN 0 ELSE 0 .. (-IF TRUE THEN FALSE ELSE 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04247 failed.
    Attempted to check if the value:
    3
    is an element of the integer 0
---*)
