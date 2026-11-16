(*---
description: Evaluates a random record expression, seed 262, number 9577.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09577 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> LET b14865 == 1 IN 7, b |-> (\E b14866 \in Nat : FALSE)] EXCEPT !.a = @ + Cardinality(({1, 2} \ {2, 1, 3}))] EXCEPT !.a = ((CHOOSE b14867 \in {b14868 \in 2..1 : TRUE} : [[x \in Nat |-> x + 1] EXCEPT ![b14867] = b14867]) % (-IF FALSE THEN 1 ELSE 1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09577 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 68 to line 14, col 70 of module random_09577
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
