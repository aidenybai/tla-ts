(*---
description: Evaluates a random int expression, seed 262, number 9393.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09393 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-LET b14571 == LET b14572 == (-1 % FALSE) IN ([a |-> 1]).a IN (CASE TRUE -> 0 [] OTHER -> b14571 - CASE FALSE -> 7 [] OTHER -> b14571)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
