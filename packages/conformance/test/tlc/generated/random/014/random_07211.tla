(*---
description: Evaluates a random set expression, seed 262, number 7211.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07211 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE (\A b11081 \in ({1} \cup {1, 2}) : (3 < -1)) -> Cardinality({1 : b11082 \in 2..1}) [] OTHER -> ([<<5, 6>> EXCEPT ![7] = -1])[IF FALSE THEN 0 ELSE 0] : b11080 \in UNION {{(<<5, 6>>)[b11083] : b11083 \in (3 .. 0)}, (-([a |-> 1, b |-> TRUE]).a)}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07211 failed.
    Attempted to compare integer -1 with non-integer:
    {}
---*)
