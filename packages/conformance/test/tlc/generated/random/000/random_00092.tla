(*---
description: Evaluates a random function expression, seed 262, number 92.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00092 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((1 = -1) <=> (~TRUE)) -> Head([<<3, 1, 2>> EXCEPT ![1] = 7]) [] OTHER -> (CHOOSE r \in [a : 1..2] : TRUE) :> (-((2147483647 :> 2))[CASE TRUE -> 2 [] OTHER -> 7])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 7"
---*)
