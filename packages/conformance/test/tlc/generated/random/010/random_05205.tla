(*---
description: Evaluates a random record expression, seed 262, number 5205.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05205 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Len(Tail(<<3, 1, 2>>)), b |-> (({} \cap 2..1) = {2147483647, 0})] EXCEPT !.a = ([[b8077 \in <<1, 2>> |-> -1] EXCEPT ![(7 * -1)] = Cardinality({})])[IF (3 \in {x \in 1..3 : x > 1}) THEN (CHOOSE b8078 \in {1, 2} : TRUE) ELSE ([a |-> 1, b |-> TRUE]).a]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 145 to line 14, col 145 of module random_05205 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 143.
    | Expression starting at line 14, column 143.
    | ExtendableExpr starting at line 14, column 142.
    | Expression starting at line 14, column 142.
    | Except Component starting at line 14, column 141.
    | Fatal errors while parsing TLA+ spec in file random_05205
    | In module random_05205
    | Could not parse module random_05205 from file random_05205.tla
    | *** Errors: 1
    | In module random_05205
    | Could not parse module random_05205 from file random_05205.tla
    3002:1 Parsing or semantic analysis failed.
---*)
