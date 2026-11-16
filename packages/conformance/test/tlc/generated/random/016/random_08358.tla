(*---
description: Evaluates a random seq expression, seed 262, number 8358.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08358 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b12930 \in DOMAIN [FALSE EXCEPT ![-1] = 2] : (~(b12930 = 7))) - (Cardinality(UNION {SUBSET {1}, {1, 2}}) * ((CHOOSE b12931 \in 2..1 : FALSE) + ([a |-> 1]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08358 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
