(*---
description: Evaluates a random set expression, seed 262, number 3020.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03020 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE TRUE -> -1 [] OTHER -> 1 + [[a |-> 1, b |-> TRUE] EXCEPT !.a = 3]) .. Len(SortSeq(<<1>>, LAMBDA p, q : p < q))) \ {Len(<<2, 3>>) : b4803 \in (DOMAIN [x \in Nat |-> x + 1] \ {3 : b4804 \in Nat})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03020 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 212 to line 14, col 214 of module random_03020
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
