(*---
description: Evaluates a random bool expression, seed 262, number 4569.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04569 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE r \in [a : 1..2] : TRUE) = (3 .. 2147483647)) <=> ((CHOOSE r \in [a : {0} \cup {1}] : TRUE) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647])) => (DOMAIN ([x \in Nat |-> x + 1] @@ (1 :> 2)) = (([a |-> 1, b |-> TRUE]).a .. Len(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04569 failed.
    Attempted to check equality of record:
    [a |-> 1]
    with non-record
    3..2147483647
---*)
