(*---
description: Evaluates a random int expression, seed 262, number 7913.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07913 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b12205 == CASE (3 = 1) -> LET b12206 == TRUE IN 7 [] OTHER -> Cardinality(Nat) IN (-CASE TRUE -> b12205 [] OTHER -> 1) % (((3 - 3) :> LET b12207 == 7 IN 2))[Cardinality((SUBSET {1} \ {1}))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07913 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
