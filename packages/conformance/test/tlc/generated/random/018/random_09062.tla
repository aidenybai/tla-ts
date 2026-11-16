(*---
description: Evaluates a random int expression, seed 262, number 9062.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09062 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (\A b14086 \in {(3 \div 7), IF TRUE THEN 2147483647 ELSE TRUE} : (~(0 .. 2147483647))) -> (Head(SubSeq(<<1, 2>>, 7, 1)) % Head((<<>> \o [x \in 1..2 |-> x]))) [] OTHER -> ([((1 :> 2) @@ (1 :> 2)) EXCEPT ![(2 \div 2)] = Len(<<>>)])[Cardinality((2..1 \cap {1, 2}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09062 failed.
    Attempted to apply the operator ~ to a non-boolean
    (a set of the form i..j)
    line 14, col 87 to line 14, col 104 of module random_09062
---*)
