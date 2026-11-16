(*---
description: Evaluates a random int expression, seed 262, number 7137.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07137 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(<<(CHOOSE b10962 \in {1} : [a |-> 1, b |-> TRUE]), CASE FALSE -> 0 [] OTHER -> 0>>) * CASE ((7 \in {2, 1, 3}) => (3 \in 2..1)) -> (([a |-> 1]).a % (7 - 3)) [] OTHER -> LET b10963 == (0 % 3) IN (b10963 * b10963)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07137 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 24 to line 14, col 68 of module random_07137
---*)
