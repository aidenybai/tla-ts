(*---
description: Evaluates a random bool expression, seed 262, number 4322.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04322 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + ([b6812 \in {-1, 3} |-> (2147483647 * b6812)])[(CHOOSE b6813 \in UNION {Nat, SUBSET {1}} : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04322 failed.
    Attempted to compare the set {{}, {1}} with the value:
    Nat
---*)
