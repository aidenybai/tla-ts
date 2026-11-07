(*---
description: Evaluates a random function expression, seed 262, number 9052.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09052 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-IF FALSE THEN 2147483647 ELSE -1) :> (([a |-> 1]).a + Head(<<>>))) @@ [b14067 \in UNION {(3 .. <<>>), {b14068 \in {1} : TRUE}} |-> IF (FALSE <=> FALSE) THEN (b14067 % 0) ELSE (CHOOSE b14069 \in {} : FALSE)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
