(*---
description: Evaluates a random set expression, seed 262, number 3703.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03703 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b5850 \in ({b5851 \in {b5852 \in {2, 1, 3} : FALSE} : (FALSE <=> FALSE)} \ (UNION {{1, 2}, {}} \cap UNION {{x \in 1..3 : x > 1}, {1}})) : ((\E b5853 \in (2147483647 .. b5850) : (-1 \in Nat)) /\ [(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + ([a |-> 1]).a])})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
