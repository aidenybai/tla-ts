(*---
description: Evaluates a random set expression, seed 262, number 9891.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09891 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({1, 2} \cup {1}) \ {b15379 : b15379 \in {2, 1, 3}}) \cup (Head(<<>>) + IF FALSE THEN 2 ELSE 7)) \cap (DOMAIN (CHOOSE f \in [{1} -> {1}] : TRUE) \cup {b15380 \in {b15381 \in {1} : TRUE} : (FALSE /\ 3)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
