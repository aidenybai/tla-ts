(*---
description: Evaluates a random function expression, seed 262, number 1362.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01362 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CHOOSE f \in [{2, 1, 3} -> {1, 2}] : TRUE) @@ [b2169 \in (2 .. -1) |-> Cardinality(Nat)]) EXCEPT ![[[a |-> (1 * 3), b |-> ([a |-> 1] = [a |-> 1, b |-> TRUE])] EXCEPT ![[a |-> (2147483647 * 1), b |-> (1 < 2)]] = ((3 :> 7))[([x \in Nat |-> x + 1])[3]]]] = ((CHOOSE b2170 \in ([x \in 1..2 |-> x] \ {}) : (TRUE <=> [x \in 1..2 |-> x])) + (CHOOSE b2171 \in {b2172 \in {1, 2} : TRUE} : (FALSE \/ TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01362 failed.
    Attempted to access record by a non-string argument: [a |-> 2147483647, b |-> TRUE]
---*)
