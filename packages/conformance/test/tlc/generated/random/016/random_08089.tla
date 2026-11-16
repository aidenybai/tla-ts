(*---
description: Evaluates a random record expression, seed 262, number 8089.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08089 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[({1} @@ [x \in 1..2 |-> x]) EXCEPT !.a = (2147483647 + 1)] EXCEPT !.a = ((<<5, 6>>)[0] \div (-1 \div -1))] EXCEPT !.a = @ + LET b12497 == ([<<5, 6>> EXCEPT ![0] = 0])[(TRUE)[0]] IN ([TRUE EXCEPT ![3] = 2..1])[([x \in 1..2 |-> x])[2]]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 115 to line 14, col 118 of module random_08089 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 113.
    | Expression starting at line 14, column 112.
    | ExtendableExpr starting at line 14, column 111.
    | ExtendableExpr starting at line 14, column 92.
    | Expression starting at line 14, column 92.
    | Fatal errors while parsing TLA+ spec in file random_08089
    | In module random_08089
    | Could not parse module random_08089 from file random_08089.tla
    | *** Errors: 1
    | In module random_08089
    | Could not parse module random_08089 from file random_08089.tla
    3002:1 Parsing or semantic analysis failed.
---*)
