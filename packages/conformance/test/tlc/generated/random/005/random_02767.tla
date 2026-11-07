(*---
description: Evaluates a random function expression, seed 262, number 2767.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02767 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((0 \div 7) :> ([x \in Nat |-> x + 1])[<<5, 6>>]) @@ (([a |-> 1]).a :> (<<5, 6>>)[2147483647])) EXCEPT ![(CHOOSE b4365 \in ({2, (1 :> 2)} \cap (2147483647 :> -1)) : ((Nat \cup {1, 2}) \subseteq ({1} \ {})))] = IF (UNION {{}, {1}} \subseteq UNION {{1}, {2, 1, 3}}) THEN ((1 % 7) - (CHOOSE b4366 \in {1} : FALSE)) ELSE (([a |-> 1, b |-> TRUE]).a + (CHOOSE b4367 \in {} : <<5, 6>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    <<5, 6>>
    is an element of Nat.
    2158:0 Attempted to check if the value:
    <<5, 6>>
    is an element of Nat.
---*)
