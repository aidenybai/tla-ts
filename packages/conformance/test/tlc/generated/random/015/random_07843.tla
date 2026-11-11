(*---
description: Evaluates a random bool expression, seed 262, number 7843.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07843 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE) = {b12115 \in {(CHOOSE b12117 \in {x \in 1..3 : x > 1} : TRUE) : b12116 \in (Nat \cap {x \in 1..3 : x > 1})} : (([a |-> 1] = [a |-> 1]) <=> ([a |-> 1] = [a |-> 1]))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
