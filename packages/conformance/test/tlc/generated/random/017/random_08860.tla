(*---
description: Evaluates a random set expression, seed 262, number 8860.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08860 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> Head(<<1, 2>>), b |-> (~TRUE)] \ {Head(<<1>>) : b13724 \in (2 .. 0)}) = UNION {{b13725 \in {1, FALSE} : (1 < b13725)}, {(-2) : b13726 \in {b13727 \in 1..3 : FALSE}}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08860 failed.
    Attempted to compare boolean FALSE with non-boolean:
    1
---*)
