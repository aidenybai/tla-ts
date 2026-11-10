(*---
description: Evaluates a random set expression, seed 262, number 7652.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07652 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({(-3) : b11777 \in (-1 .. 1)} \ ((3 .. 1) \ ({} \cap {}))), {b11778 \in ({b11779 : b11779 \in {x \in 1..3 : x > 1}} \ ({2, 1, 3} \cup {2, 1, 3})) : ((b11778 = 7) => ({1} \subseteq 1..3))}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {-3}"
---*)
