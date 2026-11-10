(*---
description: Evaluates a random set expression, seed 262, number 5916.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05916 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([b9125 \in 2..1 |-> b9125])[(-2)] .. IF ({1, 2} = Nat) THEN (<<5, 6>>)[-1] ELSE (3 % 3)) \ UNION {(UNION {1..3, SUBSET {1}} \cup (2..1 \cup {})), {(b9126 + b9126) : b9126 \in {b9127 : b9127 \in {1}}}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05916 failed.
    In applying the function
    <<>>,
    the first argument is:
    -2
    which is not in its domain.
---*)
