(*---
description: Evaluates a random bool expression, seed 262, number 6338.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06338 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<((2147483647 :> 2147483647))[(\E b9739 \in SUBSET {1} : FALSE)], ([[a |-> 1] EXCEPT !.a = -1]).a>> = [b9740 \in UNION {DOMAIN <<5, 6>>, (2..1 \cup {x \in 1..3 : x > 1})} |-> (Cardinality(Nat) % Head(<<3, 1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06338 failed.
    Attempted to check equality of integer 2147483647 with non-integer:
    FALSE
---*)
