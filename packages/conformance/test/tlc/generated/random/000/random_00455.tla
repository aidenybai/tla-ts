(*---
description: Evaluates a random set expression, seed 262, number 455.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00455 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((Nat - 7) * (<<5, 6>>)[3]) + (([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1]))[(CHOOSE b751 \in 2..1 : FALSE)]) : b750 \in ({b752 \in {b753 : b753 \in {1, 2}} : (7 = -1)} \cup {Len(<<1>>), IF TRUE THEN [x \in 1..2 |-> x] ELSE 1})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00455 failed.
    Attempted to compare the function <<1, 2>> with the value:
    1
---*)
