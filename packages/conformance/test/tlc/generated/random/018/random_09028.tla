(*---
description: Evaluates a random function expression, seed 262, number 9028.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09028 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14025 \in DOMAIN (CHOOSE f \in [{1, 2} -> {1, 2}] : TRUE) |-> (CHOOSE b14026 \in (UNION {SUBSET {1}, 1..3} \cup DOMAIN [x \in Nat |-> x + 1]) : (\A b14027 \in (SUBSET {1} \cap 2..1) : (<<1, 2>> = [x \in 1..2 |-> x])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09028 failed.
    Attempted to compare integer 1 with non-integer:
    {1}
---*)
