(*---
description: Evaluates a random bool expression, seed 262, number 4862.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04862 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (-1 \in {1, 2}) THEN (2 - 0) ELSE (7 + 7) = (CHOOSE b7573 \in UNION {Nat, SUBSET {1}} : (SUBSET {1} = {x \in 1..3 : x > 1}))) => (\E b7574 \in (LET b7575 == -1 IN -1 .. IF FALSE THEN 2147483647 ELSE 7) : (Cardinality({1}) < (2147483647 + b7574)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04862 failed.
    Attempted to compare the set {{}, {1}} with the value:
    Nat
---*)
