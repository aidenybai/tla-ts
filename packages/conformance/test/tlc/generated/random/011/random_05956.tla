(*---
description: Evaluates a random bool expression, seed 262, number 5956.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05956 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(SelectSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0), CASE [[a |-> 1] EXCEPT !.a = @ + 0] -> (CHOOSE b9188 \in SUBSET {1} : FALSE) [] OTHER -> (CHOOSE b9189 \in {2, 1, 3} : -1), ({7 : b9190 \in {1, 2}} - (-0))) = [b9191 \in (([a |-> 1]).a .. CASE TRUE -> [x \in 1..2 |-> x] [] OTHER -> FALSE) |-> Len((<<1, 2>> \o <<1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05956 failed.
    A non-boolean expression (a record) was used as a condition of a CASE. line 14, col 100 to line 14, col 129 of module random_05956
---*)
