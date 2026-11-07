(*---
description: Evaluates a random int expression, seed 262, number 5978.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05978 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> SortSeq(<<1, 2>>, LAMBDA p, q : p < q) [] OTHER -> (CHOOSE b9212 \in {1, 2} : TRUE) <=> (\E b9213 \in DOMAIN [x \in Nat |-> x + 1] : (1 = 1))) \/ SortSeq((<<-1, -1>> \o [<<1>> EXCEPT ![1] = 2147483647]), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05978 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 164 to line 14, col 191 of module random_05978
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
