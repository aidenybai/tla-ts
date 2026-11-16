(*---
description: Evaluates a random set expression, seed 262, number 7659.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07659 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (IF FALSE THEN 2147483647 ELSE 1 :> LET b11789 == -1 IN 7) \cap UNION {(CASE FALSE -> 3 [] OTHER -> 2 .. (-2147483647)), ((Nat \cup {1, 2}) \cap DOMAIN [x \in 1..2 |-> x])}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)
