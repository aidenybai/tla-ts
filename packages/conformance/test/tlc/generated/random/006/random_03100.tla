(*---
description: Evaluates a random bool expression, seed 262, number 3100.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03100 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b4944 \in ({1} \ 1..3) : (\E b4945 \in {1} : TRUE)} = {(7 \div b4946) : b4946 \in UNION {1..3, {}}}) = (-IF ({1, 2} = 2..1) THEN (<<5, 6>> * <<3, 1, 2>>) ELSE (7 % 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03100 failed.
    Attempted to compare equality of boolean FALSE with non-boolean:
    0
---*)
