(*---
description: Evaluates a random int expression, seed 262, number 8161.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08161 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((1 < 0) <=> (<<>> = [x \in 1..2 |-> x])) -> (-CASE TRUE -> -1 [] OTHER -> 0) [] OTHER -> ([b12626 \in Nat |-> b12626] + (2147483647 * 1)) * ((([x \in Nat |-> x + 1] @@ (1 :> 2)))[([a |-> 1]).a] + ([b12627 \in {} |-> 2147483647] - (1 % 0)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
