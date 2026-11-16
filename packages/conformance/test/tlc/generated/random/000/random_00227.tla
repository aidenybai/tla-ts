(*---
description: Evaluates a random set expression, seed 262, number 227.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00227 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len((<<>> \o <<1>>)) :> ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a) \cup ((UNION {{1, 2}, {1, 2}} \cap ({} \ {1})) \cap ({b373 \in {2, 1, 3} : FALSE} \ (SUBSET {1} \cup 2..1)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
