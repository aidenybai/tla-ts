(*---
description: Evaluates a random set expression, seed 262, number 9203.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09203 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b14281 \in ({b14282 \in {b14283 \in 2..1 : TRUE} : (\E b14284 \in {} : TRUE)} \cup (DOMAIN [x \in 1..2 |-> x] \cap {b14285 \in 1..3 : TRUE})) : (([[a |-> 1, b |-> TRUE] EXCEPT !.a = b14281]).a \in ({7 : b14286 \in {2, 1, 3}} \cap {b14281, b14281}))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
