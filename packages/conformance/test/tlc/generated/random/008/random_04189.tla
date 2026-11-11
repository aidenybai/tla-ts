(*---
description: Evaluates a random seq expression, seed 262, number 4189.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04189 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq(Append((<<1, 2>> \o SUBSET {1}), (2147483647 * 0)), ((3 :> 7))[(2147483647 - 7)], (Cardinality({x \in 1..3 : x > 1}) + IF TRUE THEN -1 ELSE <<1, 2>>)), (CHOOSE b6589 \in {b6590 \in (Nat \cup 1..3) : (\A b6591 \in SUBSET {1} : TRUE)} : (<<3, TRUE>> = (b6589 :> b6589))), (([[a |-> 1] EXCEPT !.a = @ + 2]).a * LET b6592 == [(1 :> 2) EXCEPT ![[x \in Nat |-> x + 1]] = 3] IN LET b6593 == {2, 1, 3} IN <<>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04189 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {{}, {1}}
---*)
