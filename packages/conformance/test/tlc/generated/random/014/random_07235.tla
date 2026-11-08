(*---
description: Evaluates a random seq expression, seed 262, number 7235.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07235 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[((<<1, 2>> \o <<>>) \o (~TRUE)) EXCEPT ![1] = ((CHOOSE b11113 \in 1..3 : FALSE) * Len(<<>>))] EXCEPT ![1] = IF (UNION {2..1, {1, 2}} = UNION {1..3, {}}) THEN IF (<<1>> = <<1>>) THEN (CHOOSE b11114 \in 1..3 : FALSE) ELSE ([x \in Nat |-> x + 1] @@ <<1>>) ELSE (LET b11115 == 0 IN b11115 \div LET b11116 == 7 IN <<5, 6>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07235 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    FALSE
---*)
