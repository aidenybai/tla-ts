(*---
description: Evaluates a random function expression, seed 262, number 9106.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09106 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14151 \in ({(2147483647 * 0) : b14152 \in {b14153 \in {x \in 1..3 : x > 1} : TRUE}} \cup ((7 .. 3) \cup ({2, 1, 3} \cap 2..1))) |-> (((b14151 + b14151) % Head(<<>>)) + (((1 :> 2))[[a |-> 1, b |-> TRUE]] % (b14151 % 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
