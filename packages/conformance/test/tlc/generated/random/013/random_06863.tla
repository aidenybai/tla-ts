(*---
description: Evaluates a random bool expression, seed 262, number 6863.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06863 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(\A b10526 \in DOMAIN (1 :> 2) : (FALSE <=> TRUE))) \/ (UNION {({1} \cup 1..3), {7, 2147483647}} \subseteq ((1..3 \ 2..1) \ {-1 : b10527 \in {x \in 1..3 : x > 1}}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
