(*---
description: Evaluates a random bool expression, seed 262, number 4789.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04789 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b7476 \in (UNION {SUBSET {1}, Nat} \ ({} \ {})) : ((b7476 % 7) < ([a |-> 1, b |-> TRUE]).a)) \in (((2147483647 \div 7) \div (CHOOSE b7477 \in {} : FALSE)) .. LET b7478 == (0 + 2) IN (<<5, 6>>)[-1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04789 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {{}, {1}}
---*)
