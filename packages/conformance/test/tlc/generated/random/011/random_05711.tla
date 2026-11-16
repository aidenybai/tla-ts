(*---
description: Evaluates a random bool expression, seed 262, number 5711.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05711 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ([a |-> -1, b |-> {x \in 1..3 : x > 1}] = {FALSE : b8786 \in {x \in 1..3 : x > 1}}) -> Head((7 \in 2..1)) [] OTHER -> ((<<5, 6>>)[1] * (<<5, 6>>)[3]) < LET b8787 == (-LET b8788 == 2147483647 IN 0) IN Head((<<3, 1, 2>> \o <<>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05711 failed.
    Attempted to check equality of record:
    [a |-> -1, b |-> {2, 3}]
    with non-record
    {FALSE}
---*)
