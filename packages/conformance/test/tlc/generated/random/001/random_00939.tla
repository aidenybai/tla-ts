(*---
description: Evaluates a random bool expression, seed 262, number 939.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00939 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b1502 \in {(CHOOSE b1504 \in {b1503, 1} : (Nat = FALSE)) : b1503 \in ((0 .. 3) \cup ({2, 1, 3} \ 2..1))} : (({0 : b1505 \in SUBSET {1}} \ {0 : b1506 \in Nat}) = ((1..3 \cup 7) \cap {b1502 : b1507 \in 2..1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00939 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    FALSE
---*)
