(*---
description: Evaluates a random record expression, seed 262, number 5435.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05435 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = CASE ((\E b8415 \in Nat : TRUE) /\ (2..1 \subseteq 1..3)) -> (Head(<<3, 1, 2>>) \div Cardinality({2, 1, 3})) [] OTHER -> (CHOOSE b8416 \in [b8417 \in {2, 1, 3} |-> 2147483647] : ([a |-> 1] = [a |-> 1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05435 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 94 to line 14, col 96 of module random_05435
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
