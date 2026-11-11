(*---
description: Evaluates a random set expression, seed 262, number 1017.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01017 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 + <<5, 6>>) * (-2147483647)) - ((--1) - Cardinality(1..3))) .. (Head((<<1>> \o <<>>)) + LET b1638 == (\E b1639 \in {1} : TRUE) IN (CHOOSE b1640 \in 1..3 : FALSE))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 57 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 54.
    | Expression starting at line 14, column 54.
    | ExtendableExpr starting at line 14, column 53.
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_01017
    | In module random_01017
    | Could not parse module random_01017 from file random_01017.tla
    | *** Errors: 1
    | In module random_01017
    | Could not parse module random_01017 from file random_01017.tla
    3002:1 Parsing or semantic analysis failed.
---*)
