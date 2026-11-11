(*---
description: Evaluates a random int expression, seed 262, number 3065.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03065 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b4863 \in {([a |-> b4864, b |-> FALSE]).a : b4864 \in {(2 * 2147483647), CASE FALSE -> 0 [] OTHER -> 1}} : (((FALSE \/ FALSE) /\ (TRUE <=> TRUE)) <=> (([a |-> 1] = {1, 2}) <=> (3 = 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03065 failed.
    2178:0 Overflow when computing 2*2147483647
---*)
