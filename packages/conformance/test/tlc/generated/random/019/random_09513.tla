(*---
description: Evaluates a random seq expression, seed 262, number 9513.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09513 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(LET b14772 == Cardinality({x \in 1..3 : x > 1}) IN (b14772 * b14772) - (CASE TRUE -> 7 [] OTHER -> 0 \div (CHOOSE b14773 \in SUBSET {1} : TRUE))), CASE ((2147483647 % 3) = CASE 7 -> 1 [] OTHER -> 1) -> Len(Append(<<>>, 7)) [] OTHER -> (CHOOSE b14774 \in ({1} \ 1..3) : (TRUE /\ TRUE))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09513 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. 7
---*)
