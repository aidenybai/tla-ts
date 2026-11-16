(*---
description: Evaluates a random int expression, seed 262, number 1251.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01251 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-(-CASE FALSE -> 3 [] OTHER -> -1)) * Cardinality((({x \in 1..3 : x > 1} \cap 1..3) \ DOMAIN <<5, 6>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
