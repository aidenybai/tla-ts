(*---
description: Evaluates a random set expression, seed 262, number 7275.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07275 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b11201 \in (IF FALSE THEN 1 ELSE -1 .. (3 % 2147483647)) : (({} = 2147483647) => (b11201 \in {1, 2}))} \cap DOMAIN [(2147483647 :> 2) EXCEPT ![(-1 + -1)] = (2147483647 * 1)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07275 failed.
    Attempted to check equality of the set {} with the value:
    2147483647
---*)
