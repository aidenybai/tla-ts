(*---
description: Evaluates a random seq expression, seed 262, number 7443.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07443 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((Tail(Append(<<>>, 1)) \o LET b11472 == (2 - 0) IN LET b11473 == {1} IN 2147483647), (CHOOSE b11474 \in {Len(<<>>), (3 * 7)} : (Append({1}, -1) = (CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE))), LET b11475 == (Cardinality(Nat) \div (CHOOSE b11476 \in 1..3 : FALSE)) IN (([a |-> 1, b |-> TRUE]).a * (b11475 % 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    2147483647
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    2147483647
---*)
