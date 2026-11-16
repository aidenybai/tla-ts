(*---
description: Evaluates a random seq expression, seed 262, number 6299.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06299 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Len(<<(-3), (-2147483647)>>), (CASE Tail(<<1>>) -> ([a |-> 1]).a [] OTHER -> ([a |-> 1] \div 3) \div LET b9691 == LET b9692 == TRUE IN b9692 IN Cardinality(<<3, 1, 2>>))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06299 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 54 to line 14, col 64 of module random_06299
---*)
