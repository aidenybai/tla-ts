(*---
description: Evaluates a random int expression, seed 262, number 7071.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07071 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b10862 \in (UNION {SUBSET {1}, {1}} \ DOMAIN (1 :> 2)) |-> Len(Append(<<>>, 2))])[(CHOOSE b10863 \in {Head(<<3, 1, 2>>), (<<5, 6>>)[7]} : ((1..3 \cup -1) = (SUBSET {1} \cap TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07071 failed.
    Attempted to access index 7 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
