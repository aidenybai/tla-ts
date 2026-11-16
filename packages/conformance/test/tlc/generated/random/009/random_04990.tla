(*---
description: Evaluates a random record expression, seed 262, number 4990.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04990 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE (Tail(<<1, 2>>) = (CHOOSE f \in [{0} \cup {1} -> {2, 1, 3}] : TRUE)) -> (IF FALSE THEN 3 ELSE 7 + LET b7769 == -1 IN b7769) [] OTHER -> IF (Nat \subseteq {1, 2}) THEN ([a |-> 1, b |-> TRUE]).a ELSE Head(<<1>>), b |-> (\A b7770 \in ((<<1>> \cap SUBSET {1}) \ {2147483647 : b7771 \in {x \in 1..3 : x > 1}}) : ((2..1 \cup 2..1) = (-1 .. -1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04990 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 168 to line 14, col 187 of module random_04990
---*)
