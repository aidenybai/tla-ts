(*---
description: Evaluates a random int expression, seed 262, number 1161.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01161 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({b1858 \in ({b1859 : b1859 \in <<3, 1, 2>>} \ (Nat \cup 1..3)) : (\A b1860 \in DOMAIN <<5, 6>> : (\A b1861 \in FALSE : TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01161 failed.
    TLC encountered a non-enumerable quantifier bound
    <<3, 1, 2>>.
    line 14, col 59 to line 14, col 69 of module random_01161
---*)
