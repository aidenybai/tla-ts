(*---
description: Evaluates a random function expression, seed 262, number 2456.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02456 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((<<1, 2>> \o <<>>)).a) :> (LET b3868 == (2147483647 * 0) IN (b3868 % 1) + ((CHOOSE r \in [a : {1}] : TRUE)).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02456 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
