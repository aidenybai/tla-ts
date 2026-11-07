(*---
description: Evaluates a random int expression, seed 262, number 3844.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03844 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b6057 \in DOMAIN <<5, 6>> |-> Head(<<>>)] @@ ({b6058 \in Nat : FALSE} @@ ([x \in 1..2 |-> x] @@ (1 :> 2)))))[(([a |-> 1, b |-> TRUE]).a % Head(Append(<<1>>, -1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    {b6058 \in Nat : <expression line 14, col 82 to line 14, col 86 of module random_03844> }
    2169:0 The first argument of @@ should be a function, but instead it is:
    {b6058 \in Nat : <expression line 14, col 82 to line 14, col 86 of module random_03844> }
---*)
