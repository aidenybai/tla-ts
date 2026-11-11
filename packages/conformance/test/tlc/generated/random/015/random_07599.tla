(*---
description: Evaluates a random bool expression, seed 262, number 7599.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07599 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({} \cup 1..3) \cap UNION {2..1, -1}) \cup (DOMAIN <<5, 6>> \cup {b11692 \in {1, 2} : TRUE})) = {CASE (TRUE => TRUE) -> ([x \in Nat |-> x + 1])[b11693] [] OTHER -> ([x \in 1..2 |-> x])[b11693] : b11693 \in UNION {UNION {{1}, {2, 1, 3}}, ({1} \ 1..3)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07599 failed.
    Attempted to compare integer -1 with non-integer:
    {}
---*)
