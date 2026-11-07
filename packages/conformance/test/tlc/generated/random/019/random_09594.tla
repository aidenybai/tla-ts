(*---
description: Evaluates a random function expression, seed 262, number 9594.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09594 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14897 \in CASE ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647] = [FALSE EXCEPT !.a = @ + 7]) -> IF (2..1 \subseteq 2..1) THEN Head(0) ELSE IF TRUE THEN 1 ELSE 1 [] OTHER -> (((1 :> 2))[7] + (CHOOSE b14898 \in {x \in 1..3 : x > 1} : [a |-> 1])) |-> CASE ((Nat = 2..1) \/ ({1, 2} = {2, 1, 3})) -> ((<<5, 6>>)[b14897] + Cardinality(2..1)) [] OTHER -> ((0 \div b14897) + ([x \in 1..2 |-> x])[b14897])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
