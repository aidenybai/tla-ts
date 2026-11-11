(*---
description: Evaluates a random function expression, seed 262, number 6656.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06656 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(IF (2147483647 \in SUBSET {1}) THEN (--1) ELSE (2147483647).a :> (Cardinality({1}) % Cardinality(1..3))) EXCEPT ![(Head(<<1, 2147483647>>) - (LET b10210 == 3 IN -1 % (0 + 2147483647)))] = (LET b10211 == Head(<<3, 1, 2>>) IN Len(<<3, 1, 2>>) * ([[x \in 1..2 |-> x] EXCEPT ![3] = 1])[(CHOOSE b10212 \in Nat : TRUE)])])
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
    | IF THEN ELSE starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | ExtendableExpr starting at line 14, column 17.
    | Fatal errors while parsing TLA+ spec in file random_06656
    | In module random_06656
    | Could not parse module random_06656 from file random_06656.tla
    | *** Errors: 1
    | In module random_06656
    | Could not parse module random_06656 from file random_06656.tla
    3002:1 Parsing or semantic analysis failed.
---*)
