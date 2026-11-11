(*---
description: Evaluates a random record expression, seed 262, number 7687.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07687 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(2 :> -1) EXCEPT !.a = (7 * 0)] EXCEPT !.a = @ + Cardinality((2147483647 \cap TRUE))] EXCEPT !.a = Head(<<CASE TRUE -> 2 [] OTHER -> 1, ([a |-> 1]).a>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07687 failed.
    Attempted to check equality of integer 2 with non-integer:
    "a"
---*)
