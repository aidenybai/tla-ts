(*---
description: Evaluates a random int expression, seed 262, number 1518.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01518 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([b2414 \in {1, 2} |-> b2414])[[[a |-> 1] EXCEPT !.a = @ + 0]] - (Cardinality(2..1) - CASE TRUE -> -1 [] OTHER -> 2)) * IF (Tail(<<3, 1, 2>>) = (CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \ {1}] : TRUE)) THEN (IF FALSE THEN 1 ELSE -1 \div Cardinality((1 :> 2))) ELSE (CHOOSE b2415 \in UNION {{}, {1}} : (TRUE <=> TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01518 failed.
    Attempted to check equality of integer 1 with non-integer:
    [a |-> 1]
---*)
