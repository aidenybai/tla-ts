(*---
description: Evaluates a random set expression, seed 262, number 9354.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09354 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b14520 \in (DOMAIN [x \in Nat |-> x + 1] \cup (1..3 \ {x \in 1..3 : x > 1})) |-> ((2147483647 \div b14520) * (CHOOSE b14521 \in SUBSET {1} : FALSE))] \cup {(([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1]))[CASE FALSE -> 1 [] OTHER -> 2] : b14522 \in ((Nat \cap {2, 1, 3}) \ {-1, [a |-> 1, b |-> TRUE]})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09354 failed.
    Attempted to check equality of record:
    [a |-> 1, b |-> TRUE]
    with non-record
    2
---*)
