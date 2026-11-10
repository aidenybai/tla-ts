(*---
description: Evaluates a random set expression, seed 262, number 6969.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06969 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{(2 + b10660) : b10660 \in ({} \ {2, 1, 3})}, (DOMAIN [x \in 1..2 |-> x] \cup {b10661 \in {1} : TRUE})} \ ((([x \in Nat |-> x + 1] \cup SUBSET {1}) \cup (SUBSET {1} \ {})) \cup DOMAIN (CHOOSE f \in [{} -> {}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06969 failed.
    Attempted to check if the value:
    1
    is an element of the function [x \in Nat |-> <expression line 14, col 148 to line 14, col 152 of module random_06969>]
---*)
