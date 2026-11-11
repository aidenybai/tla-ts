(*---
description: Evaluates a random int expression, seed 262, number 898.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00898 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (Cardinality(<<1>>) < Head(-1)) -> CASE ({2, 1, 3} = {1}) -> (--1) [] OTHER -> Head(<<>>) [] OTHER -> IF ([x \in 1..2 |-> x] \in <<5, 6>>) THEN Head(<<1>>) ELSE ([a |-> 1, b |-> TRUE]).a - ([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = (7 - 0)]).a))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 86 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 83.
    | Expression starting at line 14, column 83.
    | Case Arm starting at line 14, column 62.
    | CASE Expression starting at line 14, column 57.
    | Expression starting at line 14, column 57.
    | Fatal errors while parsing TLA+ spec in file random_00898
    | In module random_00898
    | Could not parse module random_00898 from file random_00898.tla
    | *** Errors: 1
    | In module random_00898
    | Could not parse module random_00898 from file random_00898.tla
    3002:1 Parsing or semantic analysis failed.
---*)
