(*---
description: Evaluates a random function expression, seed 262, number 4647.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04647 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[((0 .. 2147483647) \cup [[x \in 1..2 |-> x] EXCEPT ![3] = 2]) EXCEPT ![Len((<<3, 1, 2>> \o <<1>>))] = Len(IF TRUE THEN 2147483647 ELSE 2)] EXCEPT ![(CHOOSE b7274 \in ((-0) .. Len(<<>>)) : (~(\A b7275 \in {1, 2} : -1)))] = (CASE (TRUE \/ FALSE) -> CASE TRUE -> 7 [] OTHER -> 2147483647 [] OTHER -> Cardinality(2..1) % ((-1 \div 2) % (-7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 43 to line 14, col 60 of module random_04647
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04647 failed.
    Size of interval value exceeds the maximum representable size (32bits): 0..2147483647.
---*)
