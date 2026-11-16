(*---
description: Evaluates a random function expression, seed 262, number 7645.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07645 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11764 \in {(CHOOSE b11766 \in DOMAIN <<5, 6>> : (\A b11767 \in SUBSET {1} : FALSE)) : b11765 \in (DOMAIN (1 :> 2) \cap (Nat \cap {}))} |-> CASE ({b11768 \in {} : TRUE} /\ (<<3, 1, 2>> < 3)) -> (([x \in Nat |-> x + 1])[b11764] \div IF TRUE THEN 1 ELSE 2) [] OTHER -> LET b11769 == ([x \in 1..2 |-> x])[0] IN (b11764 - 2147483647)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
