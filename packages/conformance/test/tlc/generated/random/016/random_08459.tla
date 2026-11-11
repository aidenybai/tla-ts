(*---
description: Evaluates a random bool expression, seed 262, number 8459.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08459 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-2) .. Head(<<1>>)) \subseteq ({-1, 2} \cup UNION {{}, TRUE})) <=> ((IF FALSE THEN 1 ELSE 7 < CASE TRUE -> 0 [] OTHER -> 7) /\ ((TRUE <=> TRUE) <=> (7 \in 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08459 failed.
    Attempted to compare boolean TRUE with non-boolean:
    {}
---*)
