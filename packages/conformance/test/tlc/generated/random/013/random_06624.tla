(*---
description: Evaluates a random record expression, seed 262, number 6624.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06624 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b10173 == [b10174 \in {b10175 \in {2, 1, 3} : FALSE} |-> ([x \in Nat |-> x + 1])[b10174]] IN Len((<<>> \o <<1>>)), b |-> (([a |-> 7, b |-> FALSE]).a \in (UNION {1..3, 1..3} \cap (<<3, 1, 2>> \cup {1})))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1, b |-> FALSE]"
---*)
