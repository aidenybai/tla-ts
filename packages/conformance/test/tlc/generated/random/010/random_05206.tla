(*---
description: Evaluates a random set expression, seed 262, number 5206.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05206 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b8079 \in {((1 - 1) * Len(<<1>>)), (IF <<>> THEN 7 ELSE 2147483647 * Cardinality({1}))} : ([[3 EXCEPT ![1] = 1] EXCEPT ![1] = ([x \in Nat |-> x + 1])[b8079]] \o Append(SelectSeq(<<1>>, LAMBDA e : e > 0), Head(<<1, 2>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05206 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 53 to line 14, col 101 of module random_05206
---*)
