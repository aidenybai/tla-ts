(*---
description: Evaluates a random bool expression, seed 262, number 9222.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09222 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b14312 == (1 - 2) IN Head(<<1, 2>>) \in ((2..1 \cup Nat) \ (3 .. 2147483647))) /\ (~((1..3 \ Nat) \subseteq {b14313 \in (1 :> 2) : TRUE}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
