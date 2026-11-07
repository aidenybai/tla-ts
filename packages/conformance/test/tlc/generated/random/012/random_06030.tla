(*---
description: Evaluates a random int expression, seed 262, number 6030.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06030 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-CASE TRUE -> 2 [] OTHER -> 3) % (IF FALSE THEN 7 ELSE 7 * Cardinality(Nat))) + (-((2 * 2) + Len(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
