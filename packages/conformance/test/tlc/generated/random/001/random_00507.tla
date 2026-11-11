(*---
description: Evaluates a random int expression, seed 262, number 507.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00507 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((<<5, 6>> @@ (1 :> 2)) @@ (TRUE @@ <<5, 6>>)))[Cardinality((1..3 \cap 2..1))] \div (((<<1, 2>> \o <<1, 2>>) @@ (CHOOSE f \in [{1, 2} -> {1, 2} \ {1}] : TRUE)) \subseteq <<Cardinality(1..3), CASE FALSE -> 2 [] OTHER -> 1>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00507 failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    TRUE
---*)
