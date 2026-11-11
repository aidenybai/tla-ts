(*---
description: Evaluates a random set expression, seed 262, number 8350.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08350 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({1, 0} \ ({} \ 2..1)) \cap ((Nat \cap {1}) \cup {-1, 2})) \cap {b12918 \in DOMAIN (CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \cap {2}] : TRUE) : ((\A b12919 \in {1} : FALSE) => (TRUE \/ TRUE))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
