(*---
description: Evaluates a random seq expression, seed 262, number 821.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00821 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<(([a |-> 1]).a + ([a |-> 1])[3]), (IF FALSE THEN {} ELSE 2 - (<<5, 6>>)[1])>> EXCEPT ![1] = Len(SubSeq(Append(<<3, 1, 2>>, 3), Cardinality(<<1, 2>>), (1 % 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00821 failed.
    Attempted to access record by a non-string argument: 3
---*)
