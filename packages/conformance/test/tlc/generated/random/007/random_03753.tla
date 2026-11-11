(*---
description: Evaluates a random bool expression, seed 262, number 3753.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03753 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([<<1>> EXCEPT ![1] = -1] \o (<<>> \o <<1>>)) = [b5919 \in ({1} \cup 1..3) |-> (b5919 + 7)]) /\ (<<(3 - 3), IF TRUE THEN 2 ELSE 2>> = (CHOOSE f \in [{1, 2} -> {1, 2}] : TRUE))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
