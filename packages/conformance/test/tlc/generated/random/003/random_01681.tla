(*---
description: Evaluates a random bool expression, seed 262, number 1681.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01681 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((1..3 \ Nat) \ {b2680 \in 2..1 : TRUE}) \cap ({7, 0} \cap UNION {1..3, {1}})) \subseteq DOMAIN ((2 \div 7) :> (2 - 3))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
