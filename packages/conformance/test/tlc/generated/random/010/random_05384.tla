(*---
description: Evaluates a random bool expression, seed 262, number 5384.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05384 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (~(FALSE => TRUE)) THEN (CHOOSE b8321 \in UNION {{}, 1..3} : (~TRUE)) ELSE LET b8322 == (-1 % 7) IN LET b8323 == 3 IN 7 = [a |-> IF (FALSE <=> FALSE) THEN LET b8324 == -1 IN 0 ELSE ([x \in Nat |-> x + 1] @@ <<5, 6>>), b |-> (\E b8325 \in DOMAIN [x \in Nat |-> x + 1] : (TRUE <=> TRUE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05384 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 258 to line 14, col 285 of module random_05384
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
