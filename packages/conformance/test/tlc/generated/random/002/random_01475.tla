(*---
description: Evaluates a random set expression, seed 262, number 1475.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01475 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [(UNION {Nat, Nat} \cap ({1} \ {1})) EXCEPT ![(-Cardinality({2, 1, 3}))] = CASE (<<3, 1, 2>> = <<5, 6>>) -> (<<5, 6>>)[2] [] OTHER -> LET b2359 == 1 IN {x \in 1..3 : x > 1}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01475 failed.
    Attempted to apply EXCEPT construct to the value {}.
---*)
