(*---
description: Evaluates a random bool expression, seed 262, number 2867.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02867 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b4540 \in ({CASE TRUE -> 1 [] OTHER -> 2147483647, (0 \in 1..3)} \cup {b4541 \in (SUBSET {1} \cap Nat) : ([x \in 1..2 |-> x] /\ FALSE)}) : (CASE (\E b4542 \in SUBSET {1} : FALSE) -> Cardinality({}) [] OTHER -> (b4540 + 0) \in UNION {DOMAIN [x \in 1..2 |-> x], UNION {2..1, 1..3}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02867 failed.
    Attempted to compare boolean FALSE with non-boolean:
    1
---*)
