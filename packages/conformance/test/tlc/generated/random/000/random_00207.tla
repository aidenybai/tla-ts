(*---
description: Evaluates a random set expression, seed 262, number 207.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00207 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(LET b339 == IF FALSE THEN b338 ELSE 3 IN ([a |-> 1]).a * LET b340 == Cardinality(2..1) IN ([a |-> 1, b |-> TRUE]).a) : b338 \in ((([a |-> 1] \ 2..1) \cap UNION {{1}, SUBSET {1}}) \cup UNION {(1..3 \ {}), (Nat \ {2, 1, 3})})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00207 failed.
    Attempted to enumerate S \ T when S:
    [a |-> 1]
    is not enumerable.
---*)
