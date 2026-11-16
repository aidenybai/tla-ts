(*---
description: Evaluates a random bool expression, seed 262, number 4534.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04534 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((UNION {2..1, {1}}).a \in UNION {({1} \cup {x \in 1..3 : x > 1}), ({1} \cup {2, 1, 3})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04534 failed.
    Attempted to select field "a" from a non-record value {1}
    line 14, col 19 to line 14, col 39 of module random_04534
---*)
