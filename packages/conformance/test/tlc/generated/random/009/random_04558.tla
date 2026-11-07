(*---
description: Evaluates a random set expression, seed 262, number 4558.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04558 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b7148 == [[[a |-> 1] EXCEPT !.a = @ + -1] EXCEPT !.a = @ + (-1 % 7)] IN (LET b7149 == 0 IN 2 - (-2147483647)) .. (([b7150 \in {} |-> 0] @@ (\E b7151 \in 2..1 : TRUE)))[IF (\E b7152 \in {x \in 1..3 : x > 1} : b7152) THEN IF FALSE THEN 1 ELSE 1 ELSE (--1)]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 272 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 269.
    | Expression starting at line 14, column 269.
    | IF THEN ELSE starting at line 14, column 189.
    | Expression starting at line 14, column 189.
    | Some [] Form starting at line 14, column 188.
    | Fatal errors while parsing TLA+ spec in file random_04558
    | In module random_04558
    | Could not parse module random_04558 from file random_04558.tla
    | *** Errors: 1
    | In module random_04558
    | Could not parse module random_04558 from file random_04558.tla
    3002:1 Parsing or semantic analysis failed.
---*)
