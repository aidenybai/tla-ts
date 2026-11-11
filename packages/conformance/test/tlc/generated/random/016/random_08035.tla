(*---
description: Evaluates a random set expression, seed 262, number 8035.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08035 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({([(1 :> 2) EXCEPT !.a = @ + b12401]).a : b12401 \in DOMAIN [b12402 \in {1, 2} |-> 0]} \cup ({(0 * 1), (7 % 2147483647)} \ DOMAIN ((1 :> 2) @@ (1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08035 failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
