(*---
description: Evaluates a random set expression, seed 262, number 2242.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02242 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([b3527 \in (1..3 \cap Nat) |-> LET b3528 == 3 IN b3527])[Cardinality(({} \cap 2..1))], (([[a |-> 1] EXCEPT !.a = (1 :> 2)]).a % CASE ({1, 2} \subseteq <<1>>) -> (<<5, 6>>)[1] [] OTHER -> DOMAIN <<5, 6>>)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02242 failed.
    In applying the function
    <<1, 2, 3>>,
    the first argument is:
    0
    which is not in its domain.
---*)
