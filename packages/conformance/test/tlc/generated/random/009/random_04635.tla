(*---
description: Evaluates a random set expression, seed 262, number 4635.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04635 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(b7263 * 0) : b7263 \in ({} \cap 1..3)} \ ({2, 2147483647} \cup UNION {{2, 1, 3}, Nat})) \ UNION {DOMAIN [b7264 \in 1..3 |-> 1], ({b7265 \in {} : FALSE} \cap UNION {[a |-> 1], Nat})}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
