(*---
description: Evaluates a random function expression, seed 262, number 7214.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07214 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE) @@ ((<<5, 6>> @@ [x \in 1..2 |-> x]) @@ (3 :> 2))) EXCEPT ![CASE (CASE FALSE -> -1 [] OTHER -> 7 \in {-1, 2147483647}) -> Len(<<2, 7>>) [] OTHER -> Len(SelectSeq(<<1>>, LAMBDA e : e > 0))] = ((Cardinality({x \in 1..3 : x > 1}) % IF TRUE THEN 0 ELSE 3) \div LET b11086 == (CHOOSE b11087 \in 2..1 : FALSE) IN (<<5, 6>>)[b11086])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07214 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
