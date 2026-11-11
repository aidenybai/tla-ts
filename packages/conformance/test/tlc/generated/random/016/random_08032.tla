(*---
description: Evaluates a random set expression, seed 262, number 8032.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08032 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b12393 \in ((DOMAIN [x \in Nat |-> x + 1] \cap (FALSE \ {1})) \cup (DOMAIN (1 :> 2) \ UNION {[x \in Nat |-> x + 1], 2..1})) : (UNION {{b12394 \in SUBSET {1} : FALSE}, ({1, 2} \ 2..1)} = (DOMAIN [x \in 1..2 |-> x] \cap {b12393, 1}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08032 failed.
    Attempted to compare the set {} with the value:
    [x \in Nat |-> <expression line 14, col 125 to line 14, col 129 of module random_08032>]
---*)
