(*---
description: Evaluates a random int expression, seed 262, number 4807.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04807 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1] EXCEPT !.a = @ + 0]).a :> (CHOOSE b7494 \in {b7495 \in SUBSET {1} : TRUE} : (\A b7496 \in Nat : TRUE))))[(CHOOSE b7497 \in (({} \cup Nat) \ ({1, 2} \cap {})) : (Head([x \in 1..2 |-> x]) < (b7497 % 2147483647)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04807 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 120 to line 14, col 122 of module random_04807
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
