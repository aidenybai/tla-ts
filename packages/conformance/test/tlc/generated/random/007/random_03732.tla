(*---
description: Evaluates a random bool expression, seed 262, number 3732.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03732 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b5892 == CASE FALSE -> 7 [] OTHER -> 2147483647 IN Cardinality([a |-> 1]) < ((CHOOSE b5893 \in 2..1 : TRUE) \div CASE FALSE -> -1 [] OTHER -> 2147483647)) /\ (\E b5894 \in UNION {{-1 : b5895 \in {x \in 1..3 : x > 1}}, ({} \ {2, 1, 3})} : ([[a |-> 1, b |-> TRUE] EXCEPT !.a = b5894] = [a |-> 2, b |-> [a |-> 1]]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    [a |-> 1]
    2181:0 Attempted to compute cardinality of the value
    [a |-> 1]
---*)
