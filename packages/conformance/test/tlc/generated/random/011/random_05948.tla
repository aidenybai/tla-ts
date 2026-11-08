(*---
description: Evaluates a random int expression, seed 262, number 5948.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05948 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]).a) * Head(Tail((<<1>> \o <<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05948 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
