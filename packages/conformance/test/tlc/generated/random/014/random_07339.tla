(*---
description: Evaluates a random bool expression, seed 262, number 7339.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07339 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head((<<5, 6>>)[3]) * {IF TRUE THEN 0 ELSE 3, LET b11296 == 0 IN FALSE}) \in UNION {(((1 :> 2))[7] .. (2 % 3)), DOMAIN ([x \in 1..2 |-> x] @@ (1 :> 2))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07339 failed.
    Attempted to access index 3 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
