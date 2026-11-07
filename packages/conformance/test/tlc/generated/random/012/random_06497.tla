(*---
description: Evaluates a random function expression, seed 262, number 6497.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06497 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((<<5, 6>> @@ <<5, 6>>))[Len(<<>>)] :> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]).a) EXCEPT ![(-(IF TRUE THEN 2 ELSE 3 :> ([a |-> 1, b |-> TRUE]).a))] = ((([x \in 1..2 |-> x])[0] + (2 \div -1)) \div Len(Tail(<<1>>)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 213 to line 14, col 216 of module random_06497 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 211.
    | Expression starting at line 14, column 211.
    | ExtendableExpr starting at line 14, column 210.
    | ExtendableExpr starting at line 14, column 184.
    | Expression starting at line 14, column 184.
    | Fatal errors while parsing TLA+ spec in file random_06497
    | In module random_06497
    | Could not parse module random_06497 from file random_06497.tla
    | *** Errors: 1
    | In module random_06497
    | Could not parse module random_06497 from file random_06497.tla
    3002:1 Parsing or semantic analysis failed.
---*)
