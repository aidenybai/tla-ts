(*---
description: Evaluates a random function expression, seed 262, number 2339.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02339 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(SelectSeq(<<2147483647, 2147483647>>, LAMBDA e : e > 0), (IF FALSE THEN 0 ELSE 2147483647 - Cardinality(2..1))) EXCEPT ![((([x \in 1..2 |-> x])[7] % IF FALSE THEN 1 ELSE 3) \div (Cardinality({}) + (3 * 2)))] = ((((1 :> 2) @@ [x \in 1..2 |-> x]) @@ [b3711 \in 2..1 |-> [x \in 1..2 |-> x]]))[Len(<<1, 2>>)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02339 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    7
    which is not in its domain.
---*)
