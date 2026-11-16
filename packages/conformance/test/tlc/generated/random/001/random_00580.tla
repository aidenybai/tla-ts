(*---
description: Evaluates a random int expression, seed 262, number 580.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00580 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[<<1, 2>> EXCEPT ![1] = 7] EXCEPT !.a = @ + (7 * 2)] EXCEPT !.a = @ + ((3 * 3) \div (7 - 1))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00580 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
