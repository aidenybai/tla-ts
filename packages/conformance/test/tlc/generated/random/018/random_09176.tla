(*---
description: Evaluates a random record expression, seed 262, number 9176.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09176 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]).a, b |-> (\A b14245 \in {b14246 \in SUBSET {1} : FALSE} : (<<1, 2>> = <<5, 6>>))] EXCEPT !.a = (CHOOSE b14247 \in (UNION {SUBSET {1}, {2, 1, 3}} \ {2147483647, 1}) : (\E b14248 \in (Nat \cup {1}) : (b14247 \in {1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09176 failed.
    Attempted to compare the set {} with the value:
    2147483647
---*)
