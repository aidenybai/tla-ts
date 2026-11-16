(*---
description: Evaluates a random int expression, seed 262, number 1959.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01959 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b3090 \in ((--1) .. Head(FALSE)) : (\E b3091 \in (Nat \cap [x \in 1..2 |-> x]) : [a |-> 2147483647, b |-> FALSE])) - [[a |-> Len(<<1, 2>>), b |-> (TRUE => TRUE)] EXCEPT !.a = @ + LET b3092 == (0 * 3) IN (-7)]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 39 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 36.
    | Expression starting at line 14, column 36.
    | ExtendableExpr starting at line 14, column 35.
    | Expression starting at line 14, column 35.
    | Domain binding starting at line 14, column 31.
    | Fatal errors while parsing TLA+ spec in file random_01959
    | In module random_01959
    | Could not parse module random_01959 from file random_01959.tla
    | *** Errors: 1
    | In module random_01959
    | Could not parse module random_01959 from file random_01959.tla
    3002:1 Parsing or semantic analysis failed.
---*)
