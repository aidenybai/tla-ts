(*---
description: Evaluates a random int expression, seed 262, number 9268.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09268 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((-1 < 7) <=> (TRUE => TRUE)) -> CASE (FALSE \/ TRUE) -> (7 - 1) [] OTHER -> Cardinality(SUBSET {1}) [] OTHER -> (CHOOSE b14386 \in DOMAIN [x \in Nat |-> x + 1] : (TRUE \/ FALSE)) + CASE ((FALSE <=> 2147483647) /\ {b14387 : b14387 \in {1, 2}}) -> (CASE [a |-> 1] -> 2147483647 [] OTHER -> 2147483647 \div [[a |-> 1] EXCEPT !.a = @ + 7]) [] OTHER -> ((\A b14388 \in Nat : TRUE) => (<<1, 2>> = [x \in 1..2 |-> x]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 6"
---*)
