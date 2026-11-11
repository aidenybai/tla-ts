(*---
description: Evaluates a random bool expression, seed 262, number 9858.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09858 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(((1 :> 2))[1] \in {-1 : b15309 \in {1, 2}})) <=> (((<<1>> \o <<3, 1, 2>>) = ([x \in 1..2 |-> x] @@ (1 :> 2))) <=> ((-7) \in {7 : b15310 \in {1, 2}}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
