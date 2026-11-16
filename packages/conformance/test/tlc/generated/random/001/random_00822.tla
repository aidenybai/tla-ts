(*---
description: Evaluates a random int expression, seed 262, number 822.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00822 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b1346 \in DOMAIN (CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE) : ([[a |-> 2, b |-> TRUE] EXCEPT !.a = (1..3 \subseteq {1})] = [[[a |-> 1] EXCEPT !.a = 2147483647] EXCEPT !.a = @ + Cardinality({1, 2})])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00822 failed.
    2178:0 Overflow when computing 2147483647+2
---*)
