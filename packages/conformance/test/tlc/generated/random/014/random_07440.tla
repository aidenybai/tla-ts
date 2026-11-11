(*---
description: Evaluates a random set expression, seed 262, number 7440.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07440 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((<<CASE TRUE -> 3 [] OTHER -> 1, CASE FALSE -> 1 [] OTHER -> -1>> \o Tail((2 \o <<1, 2>>))), (Len(<<[x \in Nat |-> x + 1], 3>>) + IF (FALSE /\ TRUE) THEN (-1) ELSE (-1 % 3)), (CHOOSE b11471 \in (CHOOSE r \in [a : 1..2] : TRUE) : (<<b11471, 3>> = (b11471 :> [x \in 1..2 |-> x])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07440 failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    2
---*)
