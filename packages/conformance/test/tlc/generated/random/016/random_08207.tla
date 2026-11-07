(*---
description: Evaluates a random bool expression, seed 262, number 8207.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08207 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b12701 \in {b12702 \in UNION {2..1, {2, 1, 3}} : (FALSE <=> TRUE)} : (({1} \ 1..3) \subseteq ([a |-> 1, b |-> TRUE] \cap Nat))) <=> ((CHOOSE b12703 \in ({} \cup {1}) : (TRUE => TRUE)) \in {b12704 \in UNION {2..1, {x \in 1..3 : x > 1}} : ([x \in Nat |-> x + 1] \in {2, 1, 3})})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
