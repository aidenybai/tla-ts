(*---
description: Evaluates a random bool expression, seed 262, number 8657.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08657 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b13394 == CASE FALSE -> 3 [] OTHER -> 2147483647 IN CASE TRUE -> 7 [] OTHER -> b13394 :> (CASE FALSE -> 7 [] OTHER -> 2 + (CHOOSE b13395 \in 2 : TRUE))) = ({Len(<<3, 1, 2>>) : b13396 \in {b13397 \in {2, 1, 3} : TRUE}} \ (({1, 2} \cap Nat) \cup {-1 : b13398 \in 2..1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08657 failed.
    Attempted to check equality of integer 7 with non-integer:
    {3}
---*)
