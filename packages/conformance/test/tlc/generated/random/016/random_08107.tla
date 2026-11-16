(*---
description: Evaluates a random record expression, seed 262, number 8107.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08107 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((Len(<<3, 1, 2>>) % (<<5, 6>>)[7]) + Cardinality({b12529 \in SUBSET {1} : FALSE})), b |-> (\E b12530 \in {(-3), (CHOOSE b12531 \in Nat : TRUE)} : ((<<1>> = (1 :> 2)) <=> ([a |-> 1] = [a |-> 1, b |-> TRUE])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08107 failed.
    Attempted to access index 7 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
