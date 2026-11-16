(*---
description: Evaluates a random set expression, seed 262, number 5618.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05618 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1, b |-> TRUE]).a .. (1 * 2)) \ UNION {(1 :> -1), (SUBSET {1} \ {1, 2})}) \cup (((TRUE \cap {2, 1, 3}) \cup (7 + 2)) \cup (DOMAIN (1 :> 2) \ {b8691 \in {2, 1, 3} : FALSE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05618 failed.
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
