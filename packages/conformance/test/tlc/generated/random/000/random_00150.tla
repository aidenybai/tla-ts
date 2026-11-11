(*---
description: Evaluates a random function expression, seed 262, number 150.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00150 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality((TRUE => FALSE)) :> Len((<<>> \o <<3, 1, 2>>))) @@ ((Cardinality({2, 1, 3}) :> (CHOOSE b231 \in {1, 2} : TRUE)) @@ (CHOOSE f \in [{} -> {2, 1, 3}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00150 failed.
    2181:0 Attempted to compute cardinality of the value
    FALSE
---*)
