(*---
description: Evaluates a random set expression, seed 262, number 9527.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09527 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({{b14801 \in 2..1 : FALSE} : b14800 \in ({1, 2} \cup {})} \cap {(-1 % 0) : b14802 \in {0, TRUE}}), (UNION {({1} \cup {}), DOMAIN [x \in 1..2 |-> x]} \cap (LET b14803 == 2 IN b14803 .. ([a |-> 1]).a))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09527 failed.
    Attempted to compare boolean TRUE with non-boolean:
    0
---*)
