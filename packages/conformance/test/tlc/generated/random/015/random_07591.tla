(*---
description: Evaluates a random int expression, seed 262, number 7591.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07591 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((((-1 \div 2) .. (1 + 2147483647)) \cap {b11679 \in (CHOOSE r \in [a : {0} \cup {1}] : TRUE) : {b11680 \in {1} : FALSE}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
