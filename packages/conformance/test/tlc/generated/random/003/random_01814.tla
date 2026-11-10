(*---
description: Evaluates a random bool expression, seed 262, number 1814.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01814 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b2873 \in ({7 : b2874 \in 2..1} \ {b2875 \in 2..1 : FALSE}) : ((~TRUE) /\ (<<1, 2>> = <<5, 6>>))} \subseteq {b2876 \in (LET b2877 == 2 IN b2877 \ UNION {Nat, {2, 1, 3}}) : ((~FALSE) /\ (b2876 \in Nat))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
