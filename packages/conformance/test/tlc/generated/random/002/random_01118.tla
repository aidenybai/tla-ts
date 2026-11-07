(*---
description: Evaluates a random int expression, seed 262, number 1118.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01118 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((\E b1783 \in {7, 2} : (TRUE => FALSE)) => ({b1784 : b1784 \in FALSE} = UNION {2..1, Nat})) -> CASE (Cardinality(2..1) \in {0 : b1785 \in {x \in 1..3 : x > 1}}) -> [[[a |-> 1] EXCEPT !.a = @ + -1] EXCEPT !.a = CASE FALSE -> 1 [] OTHER -> 2] [] OTHER -> [[b1786 \in Nat |-> 2147483647] EXCEPT ![Head(<<3, 1, 2>>)] = (0 + 2147483647)] [] OTHER -> (CHOOSE b1787 \in {b1788 \in UNION {[x \in 1..2 |-> x], SUBSET {1}} : (~FALSE)} : ((CHOOSE f \in [{} -> {1}] : TRUE) = [[a |-> 1] EXCEPT !.a = @ + <<1>>])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2]"
---*)
