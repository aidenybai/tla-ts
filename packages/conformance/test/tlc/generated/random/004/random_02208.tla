(*---
description: Evaluates a random seq expression, seed 262, number 2208.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02208 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((~((1 :> 2) => TRUE)) => ((-1) \in {b3472 \in Nat : FALSE})) -> (((2147483647 + 2) * SubSeq(<<1, 2>>, 2, 2)) + ((0 :> -1))[Head(<<>>)]) [] OTHER -> LET b3473 == (([a |-> 1, b |-> TRUE]).a + CASE FALSE -> Nat [] OTHER -> 2) IN (SubSeq(<<>>, b3473, 2147483647)).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02208 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 25 to line 14, col 40 of module random_02208
---*)
