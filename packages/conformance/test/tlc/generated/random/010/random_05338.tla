(*---
description: Evaluates a random int expression, seed 262, number 5338.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05338 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1] EXCEPT !.a = 2]).a + (([a |-> 1, b |-> TRUE]).a % Head(<<1, 2>>))) + [[[<<1>> EXCEPT ![1] = 3] EXCEPT ![1] = ([a |-> 1]).a] EXCEPT !.a = @ + ((1 \div 2) - Head(<<3, 1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05338 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
