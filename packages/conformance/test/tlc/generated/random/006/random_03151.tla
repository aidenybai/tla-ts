(*---
description: Evaluates a random int expression, seed 262, number 3151.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03151 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (Len(Append(<<1, 2>>, 1)) < IF [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2] THEN CASE FALSE -> 3 [] OTHER -> <<1>> ELSE ([a |-> 1, b |-> TRUE]).a) -> ([(CHOOSE f \in [{1, 2} \cap {2} -> {}] : TRUE) EXCEPT ![(2147483647 * 7)] = ([a |-> 1]).a])[((<<5, 6>>)[2] * (-1 \div 2147483647))] [] OTHER -> Head([SortSeq(<<1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = (FALSE).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03151 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 49 to line 14, col 163 of module random_03151
---*)
