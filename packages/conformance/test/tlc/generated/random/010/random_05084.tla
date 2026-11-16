(*---
description: Evaluates a random int expression, seed 262, number 5084.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05084 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([b7909 \in SUBSET {1} |-> -1] @@ (CHOOSE f \in [{} -> {1}] : TRUE)))[(CHOOSE b7910 \in (2..1 \cup {}) : (b7910 < b7910))] \div ([b7911 \in (7 .. 2147483647) |-> Cardinality(1..3)])[(LET b7912 == 1 IN 2147483647 * [a |-> 1, b |-> FALSE])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05084 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 89 to line 14, col 137 of module random_05084
---*)
