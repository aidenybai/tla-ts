(*---
description: Evaluates a random function expression, seed 262, number 4956.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04956 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b7709 \in {((1 :> 2))[7], (<<>> % 2147483647)} |-> LET b7710 == CASE FALSE -> 2 [] OTHER -> b7709 IN ([a |-> 1]).a] @@ SelectSeq(CASE (FALSE \/ TRUE) -> Cardinality(Nat) [] OTHER -> IF FALSE THEN 0 ELSE 1, LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04956 failed.
    Attempted to apply function:
    <<2>>
    to argument 7, which is not in the domain of the function.
---*)
