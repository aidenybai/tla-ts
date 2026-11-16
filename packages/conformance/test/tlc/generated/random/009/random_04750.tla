(*---
description: Evaluates a random record expression, seed 262, number 4750.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04750 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality(DOMAIN <<5, 6>>), b |-> ({2147483647, -1} = UNION {Nat, Nat})] EXCEPT !.a = LET b7413 == IF (SUBSET {1} \subseteq {1, 2}) THEN ((1 :> 2))[3] ELSE (<<5, 6>>)[-1] IN [b7414 \in (b7413 .. 1) |-> ([a |-> 1]).a]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04750 failed.
    Attempted to enumerate UNION(s), but some element of s is nonenumerable.
---*)
