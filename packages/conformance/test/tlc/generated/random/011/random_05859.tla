(*---
description: Evaluates a random set expression, seed 262, number 5859.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05859 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE))[(CHOOSE b9041 \in {} : TRUE)]) .. (Cardinality(UNION {Nat, 3}) \div LET b9042 == Cardinality(SUBSET {1}) IN (b9042 - 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05859 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 78 to line 14, col 103 of module random_05859
---*)
