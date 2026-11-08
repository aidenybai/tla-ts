(*---
description: Evaluates a random set expression, seed 262, number 5910.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05910 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({1} \cup {1, 2}) \cup (2..1 \cup {1})) \cap {(-2147483647) : b9118 \in {b9119 \in SUBSET {1} : TRUE}}) \cup (DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 2147483647] \ DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> {0} \cup {1}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05910 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
