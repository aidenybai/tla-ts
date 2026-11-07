(*---
description: Evaluates a random record expression, seed 262, number 4661.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04661 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = IF (TRUE <=> TRUE) THEN (7 % 3) ELSE ([a |-> 1]).a] EXCEPT !.a = ((CHOOSE b7284 \in {7, 1} : (<<1>> => TRUE)) \div CASE (FALSE => TRUE) -> Cardinality({1, 2}) [] OTHER -> IF FALSE THEN 2 ELSE 7)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04661 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a tuple.
    line 14, col 169 to line 14, col 181 of module random_04661
---*)
