(*---
description: Evaluates a random int expression, seed 262, number 714.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00714 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b1179 == IF (\A b1180 \in {1} : FALSE) THEN (--1) ELSE Head(<<>>) IN IF ({} = 1..3) THEN ([x \in Nat |-> x + 1])[b1179] ELSE (b1179 * 7) * (-(([x \in 1..2 |-> x] @@ <<5, 6>>))[(2147483647 - 7)])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 68 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 65.
    | Expression starting at line 14, column 65.
    | IF THEN ELSE starting at line 14, column 30.
    | Expression starting at line 14, column 30.
    | Definition starting at line 14, column 21.
    | Fatal errors while parsing TLA+ spec in file random_00714
    | In module random_00714
    | Could not parse module random_00714 from file random_00714.tla
    | *** Errors: 1
    | In module random_00714
    | Could not parse module random_00714 from file random_00714.tla
    3002:1 Parsing or semantic analysis failed.
---*)
