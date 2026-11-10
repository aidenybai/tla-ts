(*---
description: Evaluates a random record expression, seed 262, number 1526.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01526 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ([a |-> 0, b |-> TRUE]).a, b |-> ({2 : b2423 \in 2..1} \subseteq {b2424 : b2424 \in {}})] EXCEPT !.a = @ + (CHOOSE b2425 \in ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] \ (1..3 \cap 1..3)) : (~([a |-> 1] => FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01526 failed.
    Attempted to enumerate S \ T when S:
    [a |-> 0, b |-> TRUE]
    is not enumerable.
---*)
