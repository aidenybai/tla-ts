(*---
description: Evaluates a random bool expression, seed 262, number 6178.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06178 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF FALSE THEN -1 ELSE 2 .. (3 * 3)) \cap DOMAIN [(1 :> 2) EXCEPT ![{1}] = 0]) \subseteq ({b9505 \in {b9506 \in {x \in 1..3 : x > 1} : TRUE} : (FALSE => FALSE)} \cup DOMAIN (-1 :> 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06178 failed.
    Attempted to check equality of integer 1 with non-integer:
    {1}
---*)
