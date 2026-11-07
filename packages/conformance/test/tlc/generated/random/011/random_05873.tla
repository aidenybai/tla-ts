(*---
description: Evaluates a random set expression, seed 262, number 5873.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05873 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({3, 2} \ (SUBSET {1} \ {})) \ ({b9056 \in {} : TRUE} \ (SUBSET {1} \cup {1}))) \ UNION {(Len(<<1, 2>>) \in ([x \in Nat |-> x + 1] \ Nat)), ({b9057 \in {1} : FALSE} \cup (SUBSET {1} \cup {1, 2}))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05873 failed.
    Attempted to check if the non-enumerable value
    3
    is element of
    {{}, {1}}
---*)
