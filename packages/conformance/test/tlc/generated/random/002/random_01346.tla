(*---
description: Evaluates a random bool expression, seed 262, number 1346.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01346 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~((<<5, 6>> @@ <<5, 6>>) \/ (2147483647 = 7))) => ({CASE FALSE -> TRUE [] OTHER -> 1, Cardinality({2, 1, 3})} = (DOMAIN {2, 1, 3} \cap (<<1, 2>> \cap [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01346 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 20 to line 14, col 61 of module random_01346
---*)
