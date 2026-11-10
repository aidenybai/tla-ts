(*---
description: Evaluates a random set expression, seed 262, number 941.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00941 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({LET b1511 == b1510 IN b1511 : b1510 \in UNION {1..3, 1..3}} \cap {(3 + 7), CASE TRUE -> 3 [] OTHER -> 7}), UNION {{([x \in Nat |-> x + 1])[0] : b1512 \in {b1513 : b1513 \in 1..3}}, (({1} \cup 1..3) \cap {b1514 : b1514 \in SUBSET {1}})}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00941 failed.
    Attempted to check equality of the set {} with the value:
    1
---*)
