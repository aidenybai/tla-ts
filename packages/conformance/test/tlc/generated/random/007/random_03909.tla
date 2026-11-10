(*---
description: Evaluates a random bool expression, seed 262, number 3909.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03909 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b6159 == LET b6160 == LET b6161 == 2 IN b6161 IN (-b6160) IN IF ({2, 1, 3} = Nat) THEN Len(<<>>) ELSE LET b6162 == b6159 IN b6159 < LET b6163 == (-Len(<<3, 1, 2>>)) IN Len((<<1>> \o <<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03909 failed.
    Attempted to check equality of the set {1, 2, 3} with the value:
    Nat
---*)
