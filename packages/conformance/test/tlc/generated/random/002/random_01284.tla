(*---
description: Evaluates a random function expression, seed 262, number 1284.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01284 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b2042 \in ((([a |-> 1]).a .. (<<5, 6>>)[2147483647]) \cap ((1..3 \cup {1}) \cup DOMAIN <<5, 6>>)) |-> (([b2043 \in <<>> |-> b2043] @@ (b2042 :> 7)))[(-(CHOOSE b2044 \in {1} : TRUE))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01284 failed.
    Attempted to access index 2147483647 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
