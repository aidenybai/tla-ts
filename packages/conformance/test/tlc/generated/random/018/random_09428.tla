(*---
description: Evaluates a random int expression, seed 262, number 9428.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09428 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (\E b14629 \in UNION {{b14630 \in {x \in 1..3 : x > 1} : TRUE}, {-1 : b14631 \in FALSE}} : (\A b14632 \in ({1} \ <<>>) : (3 /\ FALSE))) THEN ((CHOOSE f \in [{1, 2} \cap {2} -> {0} \cup {1}] : TRUE))[IF (FALSE /\ FALSE) THEN (-2) ELSE (CHOOSE b14633 \in {} : TRUE)] ELSE (Head(<<3, 2147483647>>) - (Head(<<1, 2>>) * LET b14634 == 0 IN b14634)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09428 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 100 to line 14, col 104 of module random_09428
---*)
