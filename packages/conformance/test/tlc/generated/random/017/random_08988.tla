(*---
description: Evaluates a random set expression, seed 262, number 8988.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08988 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len(SelectSeq(SubSeq(<<1>>, b13957, b13957), LAMBDA e : e > 0)) : b13957 \in (UNION {({1} \cup {2, 1, 3}), UNION {Nat, {1}}} \cup {(<<5, 6>>)[1] : b13958 \in {b13959 \in {2, 1, 3} : TRUE}})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08988 failed.
    Attempted to compare the set {1} with the value:
    Nat
---*)
