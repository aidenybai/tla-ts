(*---
description: Evaluates a random record expression, seed 262, number 3978.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03978 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE b6253 \in {b6254 \in SUBSET {1} : FALSE} : ({x \in 1..3 : x > 1} = {})) * CASE ([x \in 1..2 |-> x] \in {x \in 1..3 : x > 1}) -> CASE FALSE -> 2147483647 [] OTHER -> 3 [] OTHER -> (-1 \div 2)), b |-> (Cardinality(({1, 2} \cup <<3, 1, 2>>)) < (LET b6255 == 2 IN b6255 \div Cardinality(2..1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03978 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 101 of module random_03978
---*)
