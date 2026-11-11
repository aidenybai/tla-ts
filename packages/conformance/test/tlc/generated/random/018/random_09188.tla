(*---
description: Evaluates a random record expression, seed 262, number 9188.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09188 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (IF (\A b14260 \in SUBSET {1} : TRUE) THEN LET b14261 == 1 IN 7 ELSE CASE FALSE -> 0 [] OTHER -> 2147483647 \div ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] % [[a |-> 1, b |-> TRUE] EXCEPT !.a = FALSE])), b |-> (([[a |-> 1] EXCEPT !.a = @ + 7]).a \in (Cardinality({}) .. Head((1 :> 2))))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 7, b |-> FALSE]"
---*)
