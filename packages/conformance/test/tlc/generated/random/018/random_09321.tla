(*---
description: Evaluates a random set expression, seed 262, number 9321.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09321 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \cap {2}] : TRUE) \cup {b14459 \in {1, 1} : ((1 :> 2) = b14459)}) \ ({(CHOOSE b14461 \in SUBSET {1} : FALSE) : b14460 \in (2..1 \cup 2..1)} \cap ({b14462 \in {2, 1, 3} : {2, 1, 3}} = UNION {1..3, SUBSET {1}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09321 failed.
    Attempted to check equality of the function <<2>> with the value:
    1
---*)
