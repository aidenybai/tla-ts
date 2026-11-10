(*---
description: Evaluates a random bool expression, seed 262, number 7623.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07623 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b11729 \in {CASE (TRUE <=> TRUE) -> (3 * 3) [] OTHER -> (2 + 3), Cardinality(({1, 2} \ {}))} : (CASE (1..3 \subseteq {}) -> (-0) [] OTHER -> (~FALSE) \in (UNION {{1}, {1}} \cup {-1, 7}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07623 failed.
    Attempted to check equality of integer 1 with non-integer:
    TRUE
---*)
