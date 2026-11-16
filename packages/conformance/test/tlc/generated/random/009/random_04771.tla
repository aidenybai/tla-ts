(*---
description: Evaluates a random record expression, seed 262, number 4771.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04771 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Head([<<3, 1, 2>> EXCEPT ![1] = 7]), b |-> ((2..1 = Nat) => <<2147483647, 3>>)] EXCEPT !.a = @ + (([[a |-> 1] EXCEPT !.a = @ + 2]).a - IF (TRUE /\ TRUE) THEN (CHOOSE b7452 \in 1..3 : {x \in 1..3 : x > 1}) ELSE Len(<<>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04771 failed.
    Attempted to check equality of the set {} with the value:
    Nat
---*)
