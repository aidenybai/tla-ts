(*---
description: Evaluates a random function expression, seed 262, number 4763.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04763 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7433 \in ((CHOOSE b7434 \in (CHOOSE f \in [{} -> {2, 1, 3}] : TRUE) : (~FALSE)) .. Cardinality(({1, 2} \cup SUBSET {1}))) |-> (CHOOSE b7435 \in UNION {({1, 2} \cap [a |-> 1, b |-> TRUE]), {2147483647 : b7436 \in [x \in Nat |-> x + 1]}} : ((7 \div b7433) \in ({} \cap 2..1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04763 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 29 to line 14, col 95 of module random_04763
---*)
