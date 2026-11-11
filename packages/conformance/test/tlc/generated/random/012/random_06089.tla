(*---
description: Evaluates a random record expression, seed 262, number 6089.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06089 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(--1) EXCEPT !.a = (-1)] EXCEPT !.a = (Cardinality({}) - (2147483647 % 7))] EXCEPT !.a = @ + ((LET b9374 == 1 IN b9374 % (--1)) \div CASE CASE TRUE -> 0 [] OTHER -> 2 -> IF FALSE THEN 2147483647 ELSE 7 [] OTHER -> (-3))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 22 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | Some [] Form starting at line 14, column 18.
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_06089
    | In module random_06089
    | Could not parse module random_06089 from file random_06089.tla
    | *** Errors: 1
    | In module random_06089
    | Could not parse module random_06089 from file random_06089.tla
    3002:1 Parsing or semantic analysis failed.
---*)
