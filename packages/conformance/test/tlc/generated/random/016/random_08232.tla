(*---
description: Evaluates a random function expression, seed 262, number 8232.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08232 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(([a |-> 1, b |-> TRUE] :> 2)) :> [b12740 \in {b12741 \in Nat : TRUE} |-> (b12740 * b12740)]) :> (((1 * 2) :> (--1)))[(CASE TRUE -> 1 [] OTHER -> 0 % Len(<<1, 2>>))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 134 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 131.
    | ExtendableExpr starting at line 14, column 120.
    | Expression starting at line 14, column 120.
    | ExtendableExpr starting at line 14, column 119.
    | Expression starting at line 14, column 119.
    | Fatal errors while parsing TLA+ spec in file random_08232
    | In module random_08232
    | Could not parse module random_08232 from file random_08232.tla
    | *** Errors: 1
    | In module random_08232
    | Could not parse module random_08232 from file random_08232.tla
    3002:1 Parsing or semantic analysis failed.
---*)
