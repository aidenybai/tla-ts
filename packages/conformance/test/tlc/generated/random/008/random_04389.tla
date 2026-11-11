(*---
description: Evaluates a random record expression, seed 262, number 4389.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04389 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE ([[a |-> 1] EXCEPT !.a = 7] = [[a |-> 1] EXCEPT !.a = 2147483647]) -> IF (1 \in {x \in 1..3 : x > 1}) THEN (-3) ELSE (2 * 2147483647) [] OTHER -> CASE (\E b6903 \in SUBSET {1} : FALSE) -> (CHOOSE b6904 \in 2147483647 : FALSE) [] OTHER -> IF TRUE THEN 1 ELSE 0, b |-> (((-1 = 3) \/ (\E b6905 \in {} : TRUE)) => (\E b6906 \in DOMAIN <<5, 6>> : ({} \subseteq {x \in 1..3 : x > 1})))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1, b |-> TRUE]"
---*)
