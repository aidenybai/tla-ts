(*---
description: Evaluates a random bool expression, seed 262, number 4266.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04266 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {{b6715 \in {} : FALSE}, {b6716 \in SUBSET {1} : FALSE}} \cap DOMAIN ((1 :> 2) @@ [x \in 1..2 |-> x])) = (({b6717 : b6717 \in {2, 1, 3}} \cap (7 % 1)) \cap ({b6718 : b6718 \in {2, 1, 3}} \ (1..3 \cap {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04266 failed.
    Attempted to check if the value:
    1
    is an element of the integer 0
---*)
