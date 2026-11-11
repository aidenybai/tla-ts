(*---
description: Evaluates a random bool expression, seed 262, number 4392.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04392 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b6910 \in (((1..3 \ {2, 1, 3}) \ UNION {2..1, {1}}) \cap ((1 .. 1) \ UNION {Nat, 1..3})) : (Append(<<b6910, b6910>>, (b6910 * b6910)) = [b6911 \in (SUBSET {1} \ {1, 2}) |-> (CHOOSE b6912 \in {} : FALSE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04392 failed.
    Attempted to compare the set {1, 2, 3} with the value:
    Nat
---*)
