(*---
description: Evaluates a random record expression, seed 262, number 5977.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05977 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CASE ([a |-> 1] = [a |-> 1]) -> (2147483647 - 2147483647) [] OTHER -> (2147483647 * 2147483647) % (Cardinality(2..1) \div (2 + 7))), b |-> (\A b9211 \in ((Nat \cup Nat) \cap {7, 2}) : (Tail(<<1, 2>>) = (CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0, b |-> FALSE]"
---*)
