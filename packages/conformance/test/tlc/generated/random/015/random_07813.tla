(*---
description: Evaluates a random set expression, seed 262, number 7813.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07813 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {([a |-> 1, b |-> TRUE] < 1), [[a |-> 1] EXCEPT !.a = 3]} \ ({3, 2} \cap UNION {2..1, Nat})) \cup {b12056 \in {(<<5, 6>>)[b12057] : b12057 \in {b12058 : b12058 \in Nat}} : ((7 < b12056) <=> (3 = -1))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07813 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
