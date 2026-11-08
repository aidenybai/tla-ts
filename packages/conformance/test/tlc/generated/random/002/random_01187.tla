(*---
description: Evaluates a random bool expression, seed 262, number 1187.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01187 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(\E b1901 \in {(-7), CASE FALSE -> 7 [] OTHER -> 7} : (Head(<<>>) = Len(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01187 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
