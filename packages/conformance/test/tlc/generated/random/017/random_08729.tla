(*---
description: Evaluates a random bool expression, seed 262, number 8729.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08729 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((<<1>>)[2] + Len(<<1>>)) - Cardinality({b13519 : b13519 \in [a |-> 1]})) < (Len(<<3, 2147483647>>) \div IF (\A b13520 \in 2..1 : FALSE) THEN (--1) ELSE Len(<<1>>))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 163 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 160.
    | Expression starting at line 14, column 160.
    | IF THEN ELSE starting at line 14, column 123.
    | ExtendableExpr starting at line 14, column 95.
    | Expression starting at line 14, column 95.
    | Fatal errors while parsing TLA+ spec in file random_08729
    | In module random_08729
    | Could not parse module random_08729 from file random_08729.tla
    | *** Errors: 1
    | In module random_08729
    | Could not parse module random_08729 from file random_08729.tla
    3002:1 Parsing or semantic analysis failed.
---*)
