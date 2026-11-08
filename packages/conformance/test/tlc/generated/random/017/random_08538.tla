(*---
description: Evaluates a random int expression, seed 262, number 8538.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08538 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head(<<>>) + (<<3, 1, 2>> + 7)) :> (-IF TRUE THEN 3 ELSE 1)))[({b13231 \in {1, (1 :> 2)} : (\E b13232 \in 1..3 : FALSE)} - (-(-7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08538 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
