(*---
description: Evaluates a random set expression, seed 262, number 3336.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03336 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((IF TRUE THEN b5301 ELSE 2 + (b5301 \div b5301)) % LET b5302 == ([a |-> 1, b |-> TRUE]).a IN (--1)) : b5301 \in {CASE (FALSE <=> FALSE) -> LET b5303 == 7 IN 2 [] OTHER -> [[a |-> 1] EXCEPT !.a = @ + 3], Cardinality({SUBSET {1}, FALSE})}})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 114 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 111.
    | Expression starting at line 14, column 111.
    | Case Other Arm starting at line 14, column 69.
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_03336
    | In module random_03336
    | Could not parse module random_03336 from file random_03336.tla
    | *** Errors: 1
    | In module random_03336
    | Could not parse module random_03336 from file random_03336.tla
    3002:1 Parsing or semantic analysis failed.
---*)
