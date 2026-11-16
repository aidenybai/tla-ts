(*---
description: Evaluates a random bool expression, seed 262, number 2697.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02697 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b4266 \in DOMAIN (CHOOSE f \in [{} -> 1..2] : TRUE) : ({(b4266 % 3), (b4266 % 2147483647)} \subseteq ([a |-> 2, b |-> FALSE] = [a |-> 0, b |-> FALSE]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
