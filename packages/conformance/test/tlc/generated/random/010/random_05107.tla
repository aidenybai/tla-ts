(*---
description: Evaluates a random function expression, seed 262, number 5107.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05107 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((3 = 3) /\ (TRUE /\ FALSE)) -> ((2147483647 \div 2147483647) * Head(<<>>)) [] OTHER -> ([a |-> 1, b |-> TRUE]).a :> Len([<<2, 7>> EXCEPT ![1] = CASE FALSE -> 7 [] OTHER -> 2147483647])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
