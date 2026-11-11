(*---
description: Evaluates a random set expression, seed 262, number 7226.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07226 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b11099 \in ({b11100 \in (0 .. -1) : (\A b11101 \in Nat : TRUE)} \cap ({b11102 : b11102 \in {1, 2}} \cup DOMAIN <<5, 6>>)) : (\A b11103 \in (({1, 2} \ 2..1) \cup UNION {Nat, Nat}) : (Append(<<3, 1, 2>>, 2) = (CHOOSE f \in [{1, 2} \ {1} -> 2..1] : TRUE)))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
