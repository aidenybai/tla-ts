(*---
description: Evaluates a random function expression, seed 262, number 8360.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08360 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (~(SelectSeq(<<>>, LAMBDA e : e > 0) = [b12934 \in 1..3 |-> 2])) THEN IF ({7 : b12935 \in Nat} = UNION {{1}, Nat}) THEN ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0]).a ELSE Cardinality(({1} \cap {1, 2})) ELSE ((Tail(<<1, 2>>) \o SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) % (CHOOSE b12936 \in {b12937 \in {2, 1, 3} : FALSE} : ([a |-> 1, b |-> TRUE] = [a |-> 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08360 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 109 to line 14, col 111 of module random_08360
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
