(*---
description: Evaluates a random set expression, seed 262, number 8763.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08763 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {(({} \ SUBSET {1}) \cap (2147483647 \in 2..1)), ((7 .. 3) \ (Nat \cap 2..1))} \cap UNION {(DOMAIN [x \in 1..2 |-> x] \cup ({x \in 1..3 : x > 1} \cap 2..1)), DOMAIN [<<5, 6>> EXCEPT ![<<1>>] = 7]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08763 failed.
    Attempted to access tuple at a non integral index: <<1>>
---*)
