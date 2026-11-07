(*---
description: Evaluates a random seq expression, seed 262, number 1890.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01890 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<[[a |-> 2, b |-> FALSE] EXCEPT !.a = IF FALSE THEN 1 ELSE -1], CASE (Nat = {x \in 1..3 : x > 1}) -> (0 * 3) [] OTHER -> (CHOOSE b2967 \in {1} : FALSE)>>, Head(SortSeq((<<>> \o <<1, 2>>), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01890 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {2, 3}
---*)
