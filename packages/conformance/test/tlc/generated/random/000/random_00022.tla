(*---
description: Evaluates a random int expression, seed 262, number 22.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00022 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b29 == ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a IN (CASE (FALSE => TRUE) -> IF TRUE THEN 2147483647 ELSE -1 [] OTHER -> ({2, 1, 3} \cap {x \in 1..3 : x > 1}) - (CHOOSE b30 \in (1..3 \cup <<1>>) : (2147483647 \in SUBSET {1}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2147483647"
---*)
