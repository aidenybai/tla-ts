(*---
description: Evaluates a random record expression, seed 262, number 7605.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07605 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> LET b11698 == 2147483647 IN <<1, 2>>, b |-> ({} = 1..3)] EXCEPT !.a = Tail(SelectSeq(<<>>, LAMBDA e : e > 0))] EXCEPT !.a = @ + (([a |-> 2147483647, b |-> <<5, 6>>] % CASE FALSE -> 7 [] OTHER -> -1) - (CHOOSE b11699 \in ({1, 2} \cup {}) : (\A b11700 \in 2..1 : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
