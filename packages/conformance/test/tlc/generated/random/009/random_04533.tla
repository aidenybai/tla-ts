(*---
description: Evaluates a random record expression, seed 262, number 4533.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04533 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> CASE (-1 \in Nat) -> Cardinality(Nat) [] OTHER -> Head(<<1>>), b |-> (({1, 2} \ {}) = (-1 .. 0))] EXCEPT !.a = @ + Head([<<-1, 2>> EXCEPT ![1] = ((1 :> 2))[-1]])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04533 failed.
    Attempted to apply function:
    <<2>>
    to argument -1, which is not in the domain of the function.
---*)
