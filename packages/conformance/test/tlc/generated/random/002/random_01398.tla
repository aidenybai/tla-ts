(*---
description: Evaluates a random function expression, seed 262, number 1398.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01398 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b2230 \in (1 .. 2) |-> Len(<<>>)])[Head((<<1, 2>> \o <<>>))] :> (((0 % 7) * Len(<<>>)) + ([b2231 \in {1, 2} |-> b2231])[IF TRUE THEN 1 ELSE 1])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> 1)"
---*)
