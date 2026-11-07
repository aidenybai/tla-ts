(*---
description: Evaluates a random bool expression, seed 262, number 7603.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07603 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({CASE FALSE -> 0 [] OTHER -> 7 : b11696 \in UNION {{}, {2, 1, 3}}} = (({1} \cap {2, 1, 3}) \cap ({} \ FALSE))) /\ ({(7 * b11697) : b11697 \in (1..3 \ Nat)} = ((7 .. 7) \ UNION {1..3, {1, 2}}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
