(*---
description: Evaluates a random set expression, seed 262, number 9202.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09202 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b14279 \in DOMAIN (CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE) : ([[a |-> -1, b |-> FALSE] EXCEPT !.a = @ + (1..3 \subseteq FALSE)] = [[b14280 \in SUBSET {1} |-> [a |-> 1, b |-> TRUE]] EXCEPT ![[<<1>> EXCEPT ![1] = 3]] = IF FALSE THEN b14279 ELSE b14279])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09202 failed.
    Attempted to check if the value:
    1
    is an element of the boolean FALSE
---*)
