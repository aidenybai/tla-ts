(*---
description: Evaluates a random bool expression, seed 262, number 6418.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06418 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b9881 == ((CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE))[Cardinality((SUBSET {1} \cup {1, 2}))] IN (((1 % 0) \div (3 % b9881)) \div (CHOOSE b9882 \in {<<1, 2>>, b9881} : (2147483647 \in Nat))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06418 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
