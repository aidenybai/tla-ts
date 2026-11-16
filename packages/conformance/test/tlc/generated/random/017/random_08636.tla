(*---
description: Evaluates a random record expression, seed 262, number 8636.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08636 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE FALSE -> 2147483647 [] OTHER -> 2 \div (0 * 2)) < (-(1 - 7))) = [(Cardinality(1..3) :> IF FALSE THEN 7 ELSE 1) EXCEPT ![(LET b13371 == -1 IN 2 + (-0))] = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08636 failed.
    2179:0 The second argument of \div is 0.
---*)
