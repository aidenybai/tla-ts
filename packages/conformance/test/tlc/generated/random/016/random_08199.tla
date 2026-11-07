(*---
description: Evaluates a random set expression, seed 262, number 8199.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08199 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {DOMAIN (7 :> 2147483647), DOMAIN (2 :> 2147483647)} \cap (UNION {<<2, 2>>, ({1, 2} \cup Nat)} \cap {b12687 \in (SUBSET {1} \cap 2..1) : (7 = b12687)})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
