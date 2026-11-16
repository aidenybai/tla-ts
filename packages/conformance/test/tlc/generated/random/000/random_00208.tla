(*---
description: Evaluates a random seq expression, seed 262, number 208.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00208 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((<<Len(<<1>>), CASE TRUE -> 2 [] OTHER -> 0>> \o <<[[a |-> 1] EXCEPT !.a = 2], (1..3 \cap {2, 1, 3})>>), [[a |-> Head(<<1, 2>>), b |-> (1..3 \subseteq {})] EXCEPT !.a = CASE {2 : b341 \in SUBSET {1}} -> Len(<<>>) [] OTHER -> CASE FALSE -> 1 [] OTHER -> -1], Cardinality((({x \in 1..3 : x > 1} \cap FALSE) \ UNION {{2, 1, 3}, 2..1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00208 failed.
    A non-boolean expression (a set of the form {e1, ... ,eN}) was used as a condition of a CASE. line 14, col 197 to line 14, col 221 of module random_00208
---*)
