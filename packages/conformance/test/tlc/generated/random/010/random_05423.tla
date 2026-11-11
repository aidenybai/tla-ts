(*---
description: Evaluates a random bool expression, seed 262, number 5423.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05423 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((1 + 0) + (0 \div 3)), b |-> ({7 : b8396 \in SUBSET {1}} \subseteq ({} \ {}))] EXCEPT !.a = (((CHOOSE b8397 \in {2, 1, 3} : TRUE) < (7 * 1)) \/ ((1 \in {1}) <=> (\A b8398 \in {2, 1, 3} : FALSE)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> TRUE, b |-> FALSE]"
---*)
