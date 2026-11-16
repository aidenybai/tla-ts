(*---
description: Evaluates a random bool expression, seed 262, number 4631.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04631 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((<<1, 2147483647>> \cup (1..3 \ 2..1)) \ UNION {{b7257 \in {x \in 1..3 : x > 1} : FALSE}, {-1 : b7258 \in {x \in 1..3 : x > 1}}}) \subseteq DOMAIN [b7259 \in (SUBSET {1} \cap 1..3) |-> (b7259 + 3)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04631 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
