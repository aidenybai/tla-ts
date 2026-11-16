(*---
description: Evaluates a random record expression, seed 262, number 5955.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05955 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b9185 \in ((2147483647 \div 7) .. (CHOOSE b9186 \in SUBSET {1} : FALSE)) : ((b9185 .. b9185) \subseteq UNION {2..1, {}})), b |-> (\E b9187 \in [[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2] EXCEPT !.a = @ + ([a |-> 1, b |-> TRUE]).a] : (Cardinality(SUBSET {1}) < (-b9187)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05955 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 66 to line 14, col 100 of module random_05955
---*)
