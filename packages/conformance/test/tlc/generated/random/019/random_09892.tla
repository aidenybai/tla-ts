(*---
description: Evaluates a random int expression, seed 262, number 9892.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09892 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b15382 \in (((2147483647 .. 0) \cup DOMAIN [x \in 1..2 |-> x]) \ {Head(<<>>) : b15383 \in (SUBSET {1} \cup {})}) : (DOMAIN ((1 :> 2) @@ (1 :> 2)) = (CHOOSE r \in [a : {}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09892 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
