(*---
description: Evaluates a random record expression, seed 262, number 4639.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04639 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality(({} \cup 1..3)), b |-> ((SUBSET {1} \cup 2..1) = {[a |-> 1, b |-> TRUE], 3})] EXCEPT !.a = @ + Cardinality({b7269 \in (2..1 \ {1, 2}) : (TRUE < b7269)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04639 failed.
    Attempted to compare integer 3 with non-integer:
    [a |-> 1, b |-> TRUE]
---*)
