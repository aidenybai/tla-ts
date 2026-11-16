(*---
description: Evaluates a random set expression, seed 262, number 5355.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05355 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {{b8278 \in SUBSET {1} : FALSE}, DOMAIN [x \in 1..2 |-> x]} \cup ((2..1 \cap {1, 2}) \ {3 : b8279 \in 1..3})) \cap (({b8280 \in {2, 1, 3} : FALSE} \cap ({1, 2} \ {x \in 1..3 : x > 1})) \ {(b8281 - b8281) : b8281 \in {b8282 \in 1..3 : FALSE}})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
