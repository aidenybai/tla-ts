(*---
description: Evaluates a random bool expression, seed 262, number 1659.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01659 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b2647 == (-([[a |-> 1] EXCEPT !.a = @ + 1] * Head(<<>>))) IN CASE ((b2647 = 2) /\ (\A b2648 \in {1, 2} : TRUE)) -> IF ({1, 2} = Nat) THEN (b2647 + 0) ELSE CASE FALSE -> FALSE [] OTHER -> 0 [] OTHER -> (-Cardinality({x \in 1..3 : x > 1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
