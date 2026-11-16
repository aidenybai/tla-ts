(*---
description: Evaluates a random bool expression, seed 262, number 1457.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01457 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {((-0) \cap UNION {{2, 1, 3}, SUBSET {1}}), (UNION {Nat, {}} \cap (SUBSET {1} \cup Nat))} = DOMAIN [b2329 \in UNION {2..1, SUBSET {1}} |-> ([a |-> 1]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01457 failed.
    Attempted to compare the set {} with the value:
    Nat
---*)
