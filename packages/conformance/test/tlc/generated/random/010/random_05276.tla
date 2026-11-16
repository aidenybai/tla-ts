(*---
description: Evaluates a random set expression, seed 262, number 5276.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05276 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~((<<>> = (1 :> 2)) => (FALSE <=> TRUE))) \cap (({2, 3} \cap ({2, 1, 3} \cap {x \in 1..3 : x > 1})) \ DOMAIN [b8165 \in Nat |-> b8165])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
