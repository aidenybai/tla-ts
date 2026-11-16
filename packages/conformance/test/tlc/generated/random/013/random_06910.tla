(*---
description: Evaluates a random seq expression, seed 262, number 6910.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06910 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail([<<2, -1>> EXCEPT ![1] = (CHOOSE b10576 \in 1..3 : TRUE)]), IF (~(FALSE /\ FALSE)) THEN CASE (SUBSET {1} = Nat) -> (2147483647 + <<3, 1, 2>>) [] OTHER -> Head(<<3, 1, 2>>) ELSE ((2 + -1) - ((1 :> 2) + Nat))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06910 failed.
    Attempted to check equality of the set {{}, {1}} with the value:
    Nat
---*)
