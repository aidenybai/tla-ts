(*---
description: Evaluates a random bool expression, seed 262, number 3217.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03217 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(\A b5109 \in (DOMAIN (1 :> 2) \cup DOMAIN <<5, 6>>) : ((b5109 .. 2147483647) \subseteq {3 : b5110 \in {2, 1, 3}}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
