(*---
description: Evaluates a random bool expression, seed 262, number 1367.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01367 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{b2182 \in ((-1) .. Head(<<3, 1, 2>>)) : ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 3] = [(1 :> 2) EXCEPT !.a = @ + b2182])}, ((LET b2183 == 2 IN 0 .. Cardinality(Nat)) \cup UNION {{2 : b2184 \in {1, 2}}, (<<1>> \ {})})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01367 failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
