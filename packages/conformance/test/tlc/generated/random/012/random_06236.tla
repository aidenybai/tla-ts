(*---
description: Evaluates a random function expression, seed 262, number 6236.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06236 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b9595 \in ({2, 2} \cap ({1, 2} \ SUBSET {1})) |-> Cardinality((2147483647 \cap {x \in 1..3 : x > 1}))] EXCEPT ![IF ((FALSE \/ TRUE) /\ (~TRUE)) THEN ((TRUE => TRUE) \div (3 - -1)) ELSE CASE ([a |-> 1] = [a |-> 1, b |-> TRUE]) -> ([a |-> 1]).a [] OTHER -> (CHOOSE b9596 \in SUBSET {1} : FALSE)] = (CHOOSE b9597 \in ((<<>> @@ [x \in 1..2 |-> x]) @@ ((1 :> 2) @@ [x \in Nat |-> x + 1])) : (\A b9598 \in (b9597 \ {1}) : (2147483647 = b9597)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06236 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
