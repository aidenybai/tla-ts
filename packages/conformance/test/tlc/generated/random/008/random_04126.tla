(*---
description: Evaluates a random bool expression, seed 262, number 4126.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04126 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b6482 \in {b6483 \in {b6484 \in ({1, 2} \cap {1, 2}) : (<<1>> = <<5, 6>>)} : (\E b6485 \in ({2, 1, 3} \ [a |-> 1, b |-> TRUE]) : (<<1, 2>> = [x \in 1..2 |-> x]))} : ((({x \in 1..3 : x > 1} \cap Nat) \cap {b6486 \in {} : TRUE}) \subseteq ((2..1 \cup 2..1) \cup UNION {1..3, {x \in 1..3 : x > 1}}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
