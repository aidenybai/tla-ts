(*---
description: Evaluates a random set expression, seed 262, number 9124.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09124 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([b14173 \in UNION {{x \in 1..3 : x > 1}, 2..1} |-> CASE FALSE -> b14173 [] OTHER -> b14172])[(-CASE [a |-> 1, b |-> TRUE] -> b14172 [] OTHER -> b14172)] : b14172 \in UNION {{CASE FALSE -> b14174 [] OTHER -> 2147483647 : b14174 \in ({1, 2} \ {2, 1, 3})}, ({b14175 \in 1..3 : FALSE} \cup UNION {Nat, {x \in 1..3 : x > 1}})}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09124 failed.
    Attempted to compare the set {2, 3} with the value:
    Nat
---*)
