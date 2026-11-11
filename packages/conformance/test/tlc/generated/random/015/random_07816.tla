(*---
description: Evaluates a random bool expression, seed 262, number 7816.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07816 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> LET b12064 == 7 IN -1, b |-> (<<1, 2>> = FALSE)] EXCEPT !.a = @ + (Head(<<3, 1, 2>>) + Cardinality({1, 2}))] EXCEPT !.a = (CHOOSE b12065 \in (DOMAIN [x \in 1..2 |-> x] \ ({1, 2} \cup Nat)) : (({1, 2} \cap Nat) \subseteq {b12066 \in {2, 1, 3} : b12065}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07816 failed.
    Attempted to check equality of the function <<1, 2>> with the value:
    FALSE
---*)
