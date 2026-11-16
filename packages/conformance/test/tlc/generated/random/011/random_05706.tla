(*---
description: Evaluates a random record expression, seed 262, number 5706.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05706 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b8779 \in (-1 + 2147483647) : (b8779 < 3)} \cap DOMAIN (2 :> 3)) \cup UNION {((1 - 3) .. (<<5, 6>>)[7]), {(3 - b8780) : b8780 \in ({2, 1, 3} \cup 3)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05706 failed.
    Attempted to check if the value:
    2
    is an element of the integer 2147483646
---*)
