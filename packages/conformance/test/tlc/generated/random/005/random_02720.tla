(*---
description: Evaluates a random int expression, seed 262, number 2720.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02720 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b4297 == (((--1) + Cardinality({1})) - (-(-1))) IN ((-([x \in 1..2 |-> x])[b4297]) + IF (\A b4298 \in TRUE : TRUE) THEN ([a |-> 1]).a ELSE Head(<<1, 2>>)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 34 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 31.
    | Expression starting at line 14, column 31.
    | ExtendableExpr starting at line 14, column 30.
    | Expression starting at line 14, column 30.
    | ExtendableExpr starting at line 14, column 29.
    | Fatal errors while parsing TLA+ spec in file random_02720
    | In module random_02720
    | Could not parse module random_02720 from file random_02720.tla
    | *** Errors: 1
    | In module random_02720
    | Could not parse module random_02720 from file random_02720.tla
    3002:1 Parsing or semantic analysis failed.
---*)
