(*---
description: Evaluates a random record expression, seed 262, number 6797.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06797 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b10430 \in {([a |-> 1, b |-> TRUE]).a, (2147483647 - 7)} : (~([a |-> 1] = [a |-> 1, b |-> TRUE]))), b |-> (\A b10431 \in ((1..3 \ SUBSET {1}) \cap (7 .. 3)) : ((2 \ {2, 1, 3}) \subseteq {b10431, b10431}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06797 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
