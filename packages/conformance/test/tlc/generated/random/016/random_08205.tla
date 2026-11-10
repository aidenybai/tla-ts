(*---
description: Evaluates a random set expression, seed 262, number 8205.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08205 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({CASE (3 \in SUBSET {1}) -> Len(<<1>>) [] OTHER -> (CHOOSE b12694 \in -1 : TRUE) : b12693 \in ((2..1 \ {}) \cap UNION {{1}, 2..1})} \cap {b12695 \in {CASE TRUE -> 1 [] OTHER -> 0, Head(<<1, 2>>)} : (\A b12696 \in DOMAIN (1 :> 2) : (2..1 = Nat))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08205 failed.
    Attempted to check equality of the set {} with the value:
    Nat
---*)
