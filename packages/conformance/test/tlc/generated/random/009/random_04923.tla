(*---
description: Evaluates a random bool expression, seed 262, number 4923.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04923 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(((0 .. 1) \cap UNION {SUBSET {1}, Nat})) = CASE (~(FALSE \/ TRUE)) -> (({x \in 1..3 : x > 1} = {2, 1, 3}) <=> (TRUE <=> FALSE)) [] OTHER -> ((Nat \cup SUBSET {1}) \cap {b7659 \in 2..1 : FALSE})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04923 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {{}, {1}}
---*)
