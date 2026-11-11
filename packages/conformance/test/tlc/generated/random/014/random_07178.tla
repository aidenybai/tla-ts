(*---
description: Evaluates a random record expression, seed 262, number 7178.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07178 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = (CHOOSE b11021 \in {7 : b11022 \in Nat} : ({} \subseteq 2..1))] EXCEPT !.a = @ + (([a |-> -1, b |-> TRUE]).a + (Len(<<>>) - (CHOOSE b11023 \in 2..1 : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07178 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 107 to line 14, col 109 of module random_07178
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
