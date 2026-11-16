(*---
description: Evaluates a random function expression, seed 262, number 4083.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04083 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(IF [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] THEN (-1 \div 2) ELSE (-7) :> (CHOOSE b6417 \in {2147483647, -1} : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]))) EXCEPT ![Cardinality(((3 .. 7) \cup {b6418 \in {} : TRUE}))] = Len(SubSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), IF TRUE THEN 2147483647 ELSE [a |-> 1, b |-> TRUE], (CHOOSE b6419 \in {1} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04083 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 18 to line 14, col 178 of module random_04083
---*)
