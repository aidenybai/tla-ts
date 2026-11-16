(*---
description: Evaluates a random set expression, seed 262, number 5805.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05805 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {({-1, FALSE} \cap UNION {SUBSET {1}, Nat}), (UNION {Nat, 1..3} \cap UNION {Nat, {1, 2}})} \ {b8950 \in (({1} \ 2..1) \cap {b8951 : b8951 \in {1}}) : (~([a |-> 1] = [a |-> 1]))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05805 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {{}, {1}}
---*)
