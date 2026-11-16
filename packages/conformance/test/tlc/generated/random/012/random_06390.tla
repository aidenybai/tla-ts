(*---
description: Evaluates a random record expression, seed 262, number 6390.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06390 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b9826 \in DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> {0} \cup {1}] : TRUE) : (({x \in 1..3 : x > 1} = SUBSET {1}) <=> (<<1, 2>> \in Nat))), b |-> (IF (FALSE \/ FALSE) THEN (7 \div 1) ELSE (-1 - -1) + ((-1 % 0) + (1 * 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06390 failed.
    Attempted to check equality of integer 2 with non-integer:
    {}
---*)
