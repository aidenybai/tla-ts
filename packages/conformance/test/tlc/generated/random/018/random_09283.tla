(*---
description: Evaluates a random function expression, seed 262, number 9283.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09283 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14409 \in (LET b14410 == (1 % 1) IN Len(<<3, 1, 2>>) .. ((2 + 0) * Cardinality({x \in 1..3 : x > 1}))) |-> Cardinality(DOMAIN (<<5, 6>> @@ <<5, 6>>))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| (3 :> 2 @@ 4 :> 2)"
---*)
