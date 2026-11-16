(*---
description: Evaluates a random int expression, seed 262, number 6484.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06484 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((LET b9974 == CASE FALSE -> 1 [] OTHER -> 1 IN Len(<<3, 1, 2>>) .. (CASE FALSE -> <<1>> [] OTHER -> 7 + (2147483647 \div 2147483647)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 6"
---*)
