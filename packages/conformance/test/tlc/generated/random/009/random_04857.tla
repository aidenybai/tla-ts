(*---
description: Evaluates a random record expression, seed 262, number 4857.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04857 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = @ + 3] EXCEPT !.a = Cardinality(Nat)] EXCEPT !.a = (CASE TRUE -> <<1>> [] OTHER -> 0 - IF TRUE THEN 2 ELSE 1)] EXCEPT !.a = @ + Head({Len(<<>>), CASE FALSE -> -1 [] OTHER -> 3})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
