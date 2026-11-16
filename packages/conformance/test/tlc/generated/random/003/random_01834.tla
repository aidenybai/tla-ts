(*---
description: Evaluates a random int expression, seed 262, number 1834.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01834 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b2905 \in (UNION {{2, 1, 3}, {1, 2}} \cap (1..3 \ {})) |-> (-Head(<<3, 1, 2>>))])[([[<<>> EXCEPT !.a = 2147483647] EXCEPT !.a = {b2906 \in {1, 2} : FALSE}]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01834 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
