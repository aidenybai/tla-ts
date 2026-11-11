(*---
description: Evaluates a random record expression, seed 262, number 6978.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06978 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> ([a |-> 1, b |-> TRUE]).a, b |-> (\A b10683 \in 1..3 : TRUE)] EXCEPT !.a = (CASE FALSE -> 2147483647 [] OTHER -> 0 % Cardinality({2, 1, 3}))] EXCEPT !.a = @ + (CHOOSE b10684 \in ({2147483647, 1} \cup {1, 7}) : ((\E b10685 \in SUBSET {1} : TRUE) /\ (FALSE <=> FALSE)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1, b |-> TRUE]"
---*)
